import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import { fmtDate, money } from "@/utils/validators";
import {
    KpiGrid,
    PillBar,
    FiltersBar,
    PostsTable,
    PostDetailDrawer,
} from "@/components/admidashboard/post";

import {
    setQ,
    setCategory,
    setListingType,
    setSelectedTab,
    setPage,
    setPageSize,
    resetFilters,
    setDecision,
    openDetail,
    closeDetail,
    fetchPostsThunk,
    fetchCountsThunk,
    approvePostThunk,
    rejectPostThunk,
    hidePostThunk,
    unhidePostThunk,
    hardDeletePostThunk,
} from "@/store/adminPostsSlice";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSearchParams } from "react-router-dom";

// >>> NEW: Confirm Dialog
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function AdminPostsMUI() {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        posts,
        counts,
        loadingList,
        loadingCounts,
        actioningId,
        q,
        category,
        listingType,
        selectedTab,
        page,
        pageSize,
        totalItems,
        totalPages,
        open,
        detail,
        decision,
    } = useSelector((s) => s.adminPosts);

    /* =============== URL -> STORE (hydrate) =============== */
    useEffect(() => {
        const qp = Object.fromEntries(searchParams.entries());
        const urlTab = qp.tab || "ALL";
        const urlPage = Math.max(1, parseInt(qp.page || "1", 10) || 1);
        const urlSize = Math.max(1, parseInt(qp.size || "10", 10) || 10);
        const urlQ = qp.q || "";
        const urlCategoryId = qp.categoryId ? Number(qp.categoryId) : "";
        const urlListingType = qp.listingType || "";

        if (selectedTab !== urlTab) dispatch(setSelectedTab(urlTab));
        if (page !== urlPage) dispatch(setPage(urlPage));
        if (pageSize !== urlSize) dispatch(setPageSize(urlSize));
        if ((q || "") !== urlQ) dispatch(setQ(urlQ));
        if ((category ?? "") !== (urlCategoryId === 0 ? "" : urlCategoryId)) {
            dispatch(setCategory(urlCategoryId || ""));
        }
        if ((listingType || "") !== urlListingType) dispatch(setListingType(urlListingType));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    /* =============== STORE -> URL (debounced) =============== */
    useEffect(() => {
        const t = setTimeout(() => {
            const qp = new URLSearchParams();

            if (selectedTab && selectedTab !== "ALL") qp.set("tab", selectedTab);
            if (q && q.trim()) qp.set("q", q.trim());
            if (category !== "" && category !== null && category !== undefined) {
                qp.set("categoryId", String(category));
            }
            if (listingType && listingType.trim()) qp.set("listingType", listingType.trim());

            qp.set("page", String(page || 1));
            qp.set("size", String(pageSize || 10));

            const current = searchParams.toString();
            const next = qp.toString();
            if (current !== next) setSearchParams(qp);
        }, 250);
        return () => clearTimeout(t);
    }, [selectedTab, q, category, listingType, page, pageSize, searchParams, setSearchParams]);

    /* =============== FETCH LIST (debounce) =============== */
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchPostsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch, selectedTab, page, pageSize, q, category, listingType]);

    /* =============== FETCH COUNTS (debounce) =============== */
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchCountsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch, q, category, listingType]);

    /* =============== REALTIME WS =============== */
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("/ws"),
            reconnectDelay: 3000,
            onConnect: () => {
                client.subscribe("/topic/admin/properties", async (msg) => {
                    try {
                        JSON.parse(msg.body);
                        await dispatch(fetchCountsThunk());
                        const shouldReloadList =
                            selectedTab === "ALL" || selectedTab === "PENDING_REVIEW";
                        if (shouldReloadList) await dispatch(fetchPostsThunk());
                    } catch (e) {
                        console.warn("Invalid WS payload:", e);
                    }
                });
            },
        });
        client.activate();
        return () => client.deactivate();
    }, [dispatch, selectedTab]);

    /* =============== MUI Confirm Modal state (NEW) =============== */
    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        content: "",
        confirmText: "Xác nhận",
        loading: false,
        onConfirm: null,
    });

    const openConfirm = useCallback((cfg) => {
        setConfirm({
            open: true,
            title: cfg.title || "Xác nhận",
            content: cfg.content || "",
            confirmText: cfg.confirmText || "Xác nhận",
            loading: false,
            onConfirm: cfg.onConfirm || null,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirm((s) => ({ ...s, open: false, loading: false, onConfirm: null }));
    }, []);

    const runConfirm = useCallback(async () => {
        if (!confirm.onConfirm) return;
        try {
            setConfirm((s) => ({ ...s, loading: true }));
            await confirm.onConfirm();
        } finally {
            closeConfirm();
        }
    }, [confirm.onConfirm, closeConfirm]);

    /* =============== ACTIONS =============== */
    const approve = useCallback(
        async (id) => {
            await dispatch(approvePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    // >>> NEW: mở modal xác nhận trước khi từ chối
    const reject = useCallback(
        async (id) => {
            openConfirm({
                title: "Từ chối bài đăng",
                content: `Bạn chắc chắn muốn từ chối tin #${id}?`,
                confirmText: "Từ chối",
                onConfirm: async () => {
                    await dispatch(rejectPostThunk(id));
                    await dispatch(fetchCountsThunk());
                    await dispatch(fetchPostsThunk());
                },
            });
        },
        [dispatch, openConfirm]
    );

    const hide = useCallback(
        async (id) => {
            await dispatch(hidePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    const unhide = useCallback(
        async (id) => {
            await dispatch(unhidePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    // >>> NEW: mở modal xác nhận trước khi xóa vĩnh viễn
    const hardDelete = useCallback(
        async (id) => {
            openConfirm({
                title: "Xóa vĩnh viễn",
                content: `Xóa vĩnh viễn tin #${id}? Hành động không thể hoàn tác.`,
                confirmText: "Xóa",
                onConfirm: async () => {
                    await dispatch(hardDeletePostThunk(id));
                    await dispatch(fetchCountsThunk());
                    await dispatch(fetchPostsThunk());
                },
            });
        },
        [dispatch, openConfirm]
    );

    const onOpenDetail = useCallback(
        (r) => {
            dispatch(openDetail({ ...r, priceLabel: money(r.price) }));
        },
        [dispatch]
    );

    /* =============== KPI calc =============== */
    const kpi = useMemo(() => {
        const pending = counts.PENDING_REVIEW || 0;
        const published = counts.PUBLISHED || 0;
        const expSoon = counts.EXPIRING_SOON || 0;
        const expired = counts.EXPIRED || 0;
        const hidden = counts.HIDDEN || 0;
        const rejected = counts.REJECTED || 0;
        const total =
            pending + published + expSoon + expired + hidden + rejected;
        return {
            total,
            pending,
            active: published + expSoon,
            expSoon,
            expired,
            hidden,
            rejected,
        };
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
                <KpiGrid counts={counts} loading={loadingCounts} kpi={kpi} />

                <PillBar
                    selected={selectedTab}
                    onSelect={(key) => {
                        if (page !== 1) dispatch(setPage(1));
                        dispatch(setSelectedTab(key));
                    }}
                    counts={counts}
                />

                <FiltersBar
                    q={q}
                    setQ={(v) => {
                        if (page !== 1) dispatch(setPage(1));
                        dispatch(setQ(v));
                    }}
                    category={category}
                    setCategory={(v) => {
                        if (page !== 1) dispatch(setPage(1));
                        dispatch(setCategory(v));
                    }}
                    listingType={listingType}
                    setListingType={(v) => {
                        if (page !== 1) dispatch(setPage(1));
                        dispatch(setListingType(v));
                    }}
                    onSearch={() => dispatch(setPage(1))}
                    onReset={() => {
                        dispatch(resetFilters());
                        dispatch(setPage(1));
                        dispatch(setPageSize(10));
                    }}
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
                    setPage={(p) => dispatch(setPage(p))}
                    setPageSize={(s) => {
                        if (page !== 1) dispatch(setPage(1));
                        dispatch(setPageSize(s));
                    }}
                    onOpenDetail={onOpenDetail}
                    onApprove={approve}
                    onReject={reject}           // << dùng modal
                    onHide={hide}
                    onUnhide={unhide}
                    onHardDelete={hardDelete}   // << dùng modal
                    money={money}
                    fmtDate={fmtDate}
                    setDecision={(payload) => dispatch(setDecision(payload))}
                />

                <PostDetailDrawer
                    open={open}
                    onClose={() => dispatch(closeDetail())}
                    detail={detail}
                    decision={decision}
                    setDecision={(payload) => dispatch(setDecision(payload))}
                    money={money}
                    fmtDate={fmtDate}
                    onApprove={approve}
                    onReject={reject}       
                    actioningId={actioningId}
                    canEditDuration={false}
                />
            </Box>

            {/* === Modal xác nhận dùng chung === */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                content={confirm.content}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onClose={closeConfirm}
                onConfirm={runConfirm}
            />
        </Box>
    );
}
