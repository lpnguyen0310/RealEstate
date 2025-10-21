// src/pages/Admin/AdminPostsMUI.jsx
import { useCallback, useEffect, useMemo } from "react";
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
    // state & actions from slice
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
    // thunks
    fetchPostsThunk,
    fetchCountsThunk,
    approvePostThunk,
    rejectPostThunk,
    hidePostThunk,
    unhidePostThunk,
    hardDeletePostThunk,
} from "@/store/adminPostsSlice";

// Realtime (STOMP over SockJS)
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function AdminPostsMUI() {
    const dispatch = useDispatch();

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

    // ================== FETCH (debounce 250ms) ==================
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchPostsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch, selectedTab, page, pageSize, q, category, listingType]);

    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchCountsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch, q, category, listingType]);

    // ================== REALTIME WS ==================
    // Kết nối SockJS ở /ws (relative như axios baseURL="/api")
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("/ws"),
            reconnectDelay: 3000,
            onConnect: () => {
                // Admin subscribe kênh broadcast từ BE
                client.subscribe("/topic/admin/properties", async (msg) => {
                    try {
                        const ev = JSON.parse(msg.body); // { type, id, status, ... }
                        // làm tươi KPI
                        await dispatch(fetchCountsThunk());
                        // tin mới tạo nằm ở PENDING_REVIEW → chỉ refetch list nếu đang ở ALL/PENDING_REVIEW
                        const shouldReloadList =
                            selectedTab === "ALL" || selectedTab === "PENDING_REVIEW";
                        if (shouldReloadList) {
                            await dispatch(fetchPostsThunk());
                        }
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn("Invalid WS payload:", e);
                    }
                });
            },
        });

        client.activate();
        return () => client.deactivate();
    }, [dispatch, selectedTab]);

    // ================== ACTION HANDLERS ==================
    const approve = useCallback(
        async (id) => {
            await dispatch(approvePostThunk(id));
            // Đồng bộ lại từ server
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    const reject = useCallback(
        async (id) => {
            if (!window.confirm("Từ chối tin này?")) return;
            await dispatch(rejectPostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
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

    const hardDelete = useCallback(
        async (id) => {
            if (!window.confirm(`Xóa tin ${id}? Hành động không thể hoàn tác.`)) return;
            await dispatch(hardDeletePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    const onOpenDetail = useCallback(
        (r) => {
            // giữ nguyên priceLabel cho Drawer
            dispatch(openDetail({ ...r, priceLabel: money(r.price) }));
        },
        [dispatch]
    );

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
                {/* KPI tổng quan */}
                <KpiGrid counts={counts} loading={loadingCounts} kpi={kpi} />

                {/* Tabs trạng thái (đọc chung từ counts) */}
                <PillBar
                    selected={selectedTab}
                    onSelect={(key) => dispatch(setSelectedTab(key))}
                    counts={counts}
                />

                {/* Bộ lọc tìm kiếm */}
                <FiltersBar
                    q={q}
                    setQ={(v) => dispatch(setQ(v))}
                    category={category}
                    setCategory={(v) => dispatch(setCategory(v))}
                    listingType={listingType}
                    setListingType={(v) => dispatch(setListingType(v))}
                    onSearch={() => dispatch(setPage(1))}
                    onReset={() => dispatch(resetFilters())}
                />

                {/* Bảng danh sách */}
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
                    setPageSize={(s) => dispatch(setPageSize(s))}
                    onOpenDetail={onOpenDetail}
                    onApprove={approve}
                    onReject={reject}
                    onHide={hide}
                    onUnhide={unhide}
                    onHardDelete={hardDelete}
                    money={money}
                    fmtDate={fmtDate}
                    setDecision={(payload) => dispatch(setDecision(payload))}
                />

                {/* Drawer chi tiết + duyệt */}
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
        </Box>
    );
}
