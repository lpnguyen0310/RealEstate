// src/pages/Admin/AdminPostsMUI.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box } from "@mui/material";
import { fmtDate, normalizeStatuses, countByStatus, money } from "../../utils/validators";
import {
    KpiGrid,
    PillBar,
    FiltersBar,
    PostsTable,
    PostDetailDrawer,
} from "../../components/admidashboard/post";
import { adminPropertyApi } from "../../api/adminApi/adminPropertyApi";

export default function AdminPostsMUI() {
    const [posts, setPosts] = useState([]);
    const [counts, setCounts] = useState({});
    const [loadingList, setLoadingList] = useState(false);
    const [loadingCounts, setLoadingCounts] = useState(false);
    const [actioningId, setActioningId] = useState(null);

    // filters
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("");
    const [listingType, setListingType] = useState("");
    const [selectedTab, setSelectedTab] = useState("ALL");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [decision, setDecision] = useState({
        listingType: "NORMAL",
        durationDays: 30,
        reason: "",
    });

    const hasCountsApi = typeof adminPropertyApi?.counts === "function";

    // ================== FETCH LIST ==================
    useEffect(() => {
        let t;
        const fetchList = async () => {
            setLoadingList(true);
            try {
                const res = await adminPropertyApi.list({
                    page: page - 1,
                    size: pageSize,
                    q: q || undefined,
                    categoryId: category || undefined,
                    listingType: listingType || undefined,
                    status: selectedTab === "ALL" ? undefined : selectedTab,
                    sort: "postedAt,desc",
                });

                const content = Array.isArray(res?.content) ? res.content : [];
                const normalizedRows = (res?.content || []).map((p) => ({
                    id: p.id,
                    title: p.title,
                    category: p.categoryName,
                    listingType: p.listingType,
                    displayAddress: p.displayAddress,
                    price: p.price,
                    status: p.status,
                    createdAt: p.postedAt,
                    expiresAt: p.expiresAt,
                    author: { name: p.authorName, email: p.authorEmail },
                    images: p.imageUrls || [],
                }));

                const normalized = normalizeStatuses(normalizedRows);
                setPosts(normalized);
                setTotalItems(res?.totalElements ?? content.length);
                setTotalPages(res?.totalPages ?? 1);

                // ✅ FIX: Khi không có counts API, chỉ cập nhật counts khi tab = ALL
                // để counts phản ánh bộ lọc (q/category/listingType) nhưng không bị lọc theo status.
                if (!hasCountsApi && selectedTab === "ALL") {
                    const newCounts = countByStatus(normalized);
                    setCounts(newCounts);
                }
            } catch (e) {
                console.error("Lỗi khi load properties:", e);
            } finally {
                setLoadingList(false);
            }
        };

        t = setTimeout(fetchList, 250);
        return () => clearTimeout(t);
    }, [selectedTab, page, pageSize, q, category, listingType, hasCountsApi]);

    // ================== FETCH COUNTS ==================
    useEffect(() => {
        if (!hasCountsApi) return;
        let t;
        const fetchCounts = async () => {
            setLoadingCounts(true);
            try {
                const res = await adminPropertyApi.counts({
                    q: q || undefined,
                    categoryId: category || undefined,
                    listingType: listingType || undefined,
                    // Không gửi status để counts luôn là toàn tập theo filter tìm kiếm
                });
                setCounts(res || {});
            } catch (e) {
                console.error("Lỗi khi load counts:", e);
            } finally {
                setLoadingCounts(false);
            }
        };
        t = setTimeout(fetchCounts, 250);
        return () => clearTimeout(t);
    }, [q, category, listingType, hasCountsApi]);

    const refreshCounts = useCallback(async () => {
        if (!hasCountsApi) return;
        try {
            const res = await adminPropertyApi.counts({
                q: q || undefined,
                categoryId: category || undefined,
                listingType: listingType || undefined,
            });
            setCounts(res || {});
        } catch { }
    }, [hasCountsApi, q, category, listingType]);

    // ================== ACTIONS ==================
    const approve = useCallback(
        async (id) => {
            try {
                setActioningId(id);
                await adminPropertyApi.approve(id, {
                    durationDays: Number(decision.durationDays) || null,
                    note: decision.note || "",
                });
                setPosts((prev) =>
                    prev.map((x) =>
                        x.id === id
                            ? {
                                ...x,
                                status: "PUBLISHED",
                                expiresAt: dayjs().add(decision.durationDays, "day").toISOString(),
                            }
                            : x
                    )
                );
                bumpCounts("PENDING_REVIEW", "PUBLISHED");
                await refreshCounts();
            } catch (e) {
                console.error("Approve failed", e);
            } finally {
                setActioningId(null);
            }
        },
        [decision, refreshCounts]
    );

    const bumpCounts = useCallback((from, to, removed = false) => {
        setCounts((prev) => {
            const next = { ...prev };
            if (from && next[from] != null) next[from] = Math.max(0, (next[from] || 0) - 1);
            if (!removed && to) next[to] = (next[to] || 0) + 1;
            return next;
        });
    }, []);

    const reject = useCallback(
        async (id) => {
            if (!window.confirm("Từ chối tin này?")) return;
            try {
                setActioningId(id);
                await adminPropertyApi.reject(id, decision.reason ?? ""); // <- cho phép rỗng
                let from = null;
                setPosts(prev =>
                    prev.map(x => {
                        if (x.id === id) { from = x.status; return { ...x, status: "REJECTED" }; }
                        return x;
                    })
                );
                bumpCounts(from || "PENDING_REVIEW", "REJECTED");
                await refreshCounts();
            } finally {
                setActioningId(null);
            }
        },
        [decision.reason, bumpCounts, refreshCounts]
    );


    // HIDE: PUBLISHED -> HIDDEN
    const hide = useCallback(
        async (id) => {
            try {
                setActioningId(id);
                await adminPropertyApi.hide(id);

                let from = null;
                setPosts((prev) =>
                    prev.map((x) => {
                        if (x.id === id) {
                            from = x.status;
                            return { ...x, status: "HIDDEN" };
                        }
                        return x;
                    })
                );

                bumpCounts(from || "PUBLISHED", "HIDDEN");
                await refreshCounts();
            } finally {
                setActioningId(null);
            }
        },
        [bumpCounts, refreshCounts]
    );

    const unhide = useCallback(
        async (id) => {
            try {
                setActioningId(id);
                await adminPropertyApi.unhide(id);

                setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, status: "PUBLISHED" } : x)));

                bumpCounts("HIDDEN", "PUBLISHED");
                await refreshCounts();
            } finally {
                setActioningId(null);
            }
        },
        [bumpCounts, refreshCounts]
    );

    // HARD DELETE
    const hardDelete = useCallback(
        async (id) => {
            if (!window.confirm(`Xóa tin ${id}? Hành động không thể hoàn tác.`)) return;
            try {
                setActioningId(id);
                await adminPropertyApi.hardDelete(id);

                let from = null;
                setPosts((prev) => {
                    const found = prev.find((x) => x.id === id);
                    from = found?.status;
                    return prev.filter((x) => x.id !== id);
                });

                bumpCounts(from || null, null, true);
                await refreshCounts();
            } finally {
                setActioningId(null);
            }
        },
        [bumpCounts, refreshCounts]
    );

    const onOpenDetail = useCallback((r) => {
        setDetail({ ...r, priceLabel: money(r.price) });
        setDecision({
            listingType: r.listingType || "NORMAL",
            durationDays: 30,
            note: "",
        });
        setOpen(true);
    }, []);

    const resetFilters = useCallback(() => {
        setQ("");
        setCategory("");
        setListingType("");
        setPage(1);
    }, []);

    // ================== KPI ==================
    const kpi = useMemo(() => {
        const pending = counts.PENDING_REVIEW || 0;
        const published = counts.PUBLISHED || 0;
        const expSoon = counts.EXPIRING_SOON || 0;
        const expired = counts.EXPIRED || 0;
        const hidden = counts.HIDDEN || 0;
        const rejected = counts.REJECTED || 0;
        const total = pending + published + expSoon + expired + hidden + rejected;
        return { total, pending, active: published + expSoon, expSoon, expired, hidden, rejected };
    }, [counts]);

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                bgcolor: "#f8f9fc",
                px: "-24px",
                py: "3px",
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 1440 }}>
                <KpiGrid counts={counts} loading={loadingCounts} />

                <PillBar
                    selected={selectedTab}
                    onSelect={(key) => {
                        setSelectedTab(key);
                        setPage(1);
                    }}
                    counts={counts}
                />

                <FiltersBar
                    q={q}
                    setQ={setQ}
                    category={category}
                    setCategory={setCategory}
                    listingType={listingType}
                    setListingType={setListingType}
                    onSearch={() => setPage(1)}
                    onReset={resetFilters}
                />

                <PostsTable
                    rows={posts}
                    loading={loadingList}
                    actioningId={actioningId}
                    page={page}
                    totalPages={totalPages}
                    start={(page - 1) * pageSize + 1}
                    end={Math.min(page * pageSize, totalItems)}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    onOpenDetail={onOpenDetail}
                    onApprove={approve}
                    onReject={reject}
                    onHide={hide}
                    onUnhide={unhide}
                    onHardDelete={hardDelete}
                    money={money}
                    fmtDate={fmtDate}
                    setDecision={setDecision}
                />

                <PostDetailDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    detail={detail}
                    decision={decision}
                    setDecision={setDecision}
                    money={money}
                    fmtDate={fmtDate}
                    onApprove={approve}
                    onReject={reject}
                    actioningId={actioningId}
                />
            </Box>
        </Box>
    );
}
