import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, TextField, Stack, Typography, debounce } from "@mui/material";
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
    setPendingAction,
    clearPendingAction,
} from "@/store/adminPostsSlice";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSearchParams } from "react-router-dom";
import ReportDetailsModal from "@/components/admidashboard/post/ReportDetailsModal";
import {
    useLazyGetReportsForPostQuery,
    useDeleteSelectedReportsMutation,
    useSendWarningMutation,
} from "@/services/reportApiSlice";

import ConfirmDialog from "@/components/common/ConfirmDialog";

/* =============== ƯU TIÊN REVIEW THEO LISTING TYPE =============== */
const LISTING_REVIEW_PRIORITY = {
    PREMIUM: 3,
    VIP: 2,
    NORMAL: 1,
};

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
        pendingAction,
    } = useSelector((s) => s.adminPosts);

    /* =============== URL -> STORE (hydrate) =============== */
    useEffect(() => {
        const qp = Object.fromEntries(searchParams.entries());
        const reportId = qp.reportPostId ? Number(qp.reportPostId) : null;
        const reviewId = qp.reviewPostId ? Number(qp.reviewPostId) : null;

        // Xử lý các filter KHÁC q và tab
        const urlPage = Math.max(1, parseInt(qp.page || "1", 10) || 1);
        const urlSize = Math.max(1, parseInt(qp.size || "10", 10) || 10);
        const urlCategoryId = qp.categoryId ? Number(qp.categoryId) : "";
        const urlListingType = qp.listingType || "";

        if (page !== urlPage) dispatch(setPage(urlPage));
        if (pageSize !== urlSize) dispatch(setPageSize(urlSize));
        if ((category ?? "") !== (urlCategoryId === 0 ? "" : urlCategoryId)) {
            dispatch(setCategory(urlCategoryId || ""));
        }
        if ((listingType || "") !== urlListingType) dispatch(setListingType(urlListingType));

        // --- Xử lý logic Q và TAB theo yêu cầu ---
        if (reportId) {
            dispatch(setPendingAction({ type: "report", postId: reportId }));
            // 1. Set Q bằng ID từ thông báo
            if (q !== String(reportId)) {
                dispatch(setQ(String(reportId)));
            }
            // 2. Chuyển sang tab PUBLISHED
            if (selectedTab !== "PUBLISHED") {
                dispatch(setSelectedTab("PUBLISHED"));
            }
        } else if (reviewId) {
            dispatch(setPendingAction({ type: "review", postId: reviewId }));
            // 1. Set Q bằng ID từ thông báo
            if (q !== String(reviewId)) {
                dispatch(setQ(String(reviewId)));
            }
            // 2. Chuyển sang tab PENDING_REVIEW
            if (selectedTab !== "PENDING_REVIEW") {
                dispatch(setSelectedTab("PENDING_REVIEW"));
            }
        }
        // Bình thường: Không có thông báo
        else {
            const urlTab = qp.tab || "ALL";
            const urlQ = qp.q || "";
            if (selectedTab !== urlTab) dispatch(setSelectedTab(urlTab));
            if (q !== urlQ) dispatch(setQ(urlQ)); // Đọc 'q' từ URL
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, dispatch]);

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

    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchCountsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch]);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("/ws"),
            reconnectDelay: 3000,
            onConnect: () => {
                client.subscribe("/topic/admin/properties", async (msg) => {
                    try {
                        JSON.parse(msg.body);

                        // 1. Luôn tải lại counts
                        await dispatch(fetchCountsThunk());

                        // 2. Luôn tải lại danh sách
                        await dispatch(fetchPostsThunk());
                    } catch (e) {
                        console.warn("Invalid WS payload:", e);
                    }
                });
            },
        });
        client.activate();
        return () => client.deactivate();
    }, [dispatch]);

    /* =============== MUI Confirm Modal state (EXISTING) =============== */
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

    /* =============== NEW: Reject Reason Dialog state =============== */
    const [rejectDlg, setRejectDlg] = useState({ open: false, id: null, reason: "" });

    /* =============== ACTIONS =============== */
    const approve = useCallback(
        async (id) => {
            await dispatch(approvePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    // === mở dialog yêu cầu lý do thay vì confirm trống
    const reject = useCallback((id) => {
        setRejectDlg({ open: true, id, reason: "" });
    }, []);

    const closeReject = useCallback(() => {
        setRejectDlg((s) => ({ ...s, open: false, id: null, reason: "" }));
    }, []);

    const confirmReject = useCallback(async () => {
        const reason = (rejectDlg.reason || "").trim();
        if (!reason) return;
        // set vào Redux để rejectPostThunk đọc
        dispatch(setDecision({ reason }));
        await dispatch(rejectPostThunk(rejectDlg.id));
        await dispatch(fetchCountsThunk());
        await dispatch(fetchPostsThunk());
        closeReject();
    }, [dispatch, rejectDlg, closeReject]);

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

    const [deleteReports, { isLoading: isDeletingReports }] = useDeleteSelectedReportsMutation();
    const [triggerGetReports, { isLoading: isLoadingReports }] = useLazyGetReportsForPostQuery();
    const [sendWarning, { isLoading: isSendingWarning }] = useSendWarningMutation();

    const [reportsModal, setReportsModal] = useState({
        open: false,
        postId: null,
        reports: [],
    });

    const [warningDlg, setWarningDlg] = useState({ open: false, id: null, message: "" });

    const openReports = useCallback(
        async (postId) => {
            setReportsModal({ open: true, postId: postId, reports: [] });

            try {
                const data = await triggerGetReports(postId).unwrap();
                setReportsModal({ open: true, postId, reports: data });
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setReportsModal({ open: false, postId: null, reports: [] });
            }
        },
        [triggerGetReports]
    );

    const closeReports = useCallback(() => {
        setReportsModal({ open: false, postId: null, reports: [] });
    }, []);

    const handleLockPost = useCallback(
        (postId) => {
            // 1. Đóng modal chi tiết báo cáo
            closeReports();
            // 2. Mở modal "Nhập lý do" (chính là hàm 'reject')
            reject(postId);
        },
        [reject, closeReports]
    );

    const handleDeleteReports = useCallback(
        async (postId, reportIds) => {
            console.log(`Admin yêu cầu xóa ${reportIds.length} báo cáo cho bài: ${postId}`);

            try {
                await deleteReports({ postId, reportIds }).unwrap();
                await dispatch(fetchCountsThunk());
                await dispatch(fetchPostsThunk());
            } catch (err) {
                console.error("Xóa báo cáo thất bại:", err);
            }

            closeReports();
        },
        [deleteReports, dispatch, closeReports]
    );

    const handleSendWarning = useCallback((postId) => {
        // Đóng modal chi tiết, mở modal nhập cảnh báo
        setWarningDlg({ open: true, id: postId, message: "" });
    }, []);

    // chỉ set open: false
    const closeWarning = useCallback(() => {
        setWarningDlg((s) => ({ ...s, open: false }));
    }, []);

    // dọn dẹp state SAU KHI modal đã đóng xong
    const handleWarningExited = useCallback(() => {
        setWarningDlg({ open: false, id: null, message: "" });
    }, []);

    const confirmSendWarning = useCallback(
        async () => {
            const message = warningDlg.message.trim();
            if (message.length < 10) return;

            try {
                await sendWarning({ postId: warningDlg.id, message }).unwrap();
                closeWarning();
            } catch (err) {
                console.error("Gửi cảnh báo thất bại:", err);
            }
        },
        [warningDlg, closeWarning, sendWarning]
    );

    /* =============== XỬ LÝ HÀNH ĐỘNG CHỜ (Mở modal/drawer) =============== */
    useEffect(() => {
        if (!pendingAction) return;

        if (loadingList || !posts || posts.length === 0) {
            return;
        }

        const { type, postId } = pendingAction;
        const postToOpen = posts.find((p) => p.id === postId);

        if (!postToOpen) {
            console.warn(
                `Pending Action: Không tìm thấy Post #${postId} (Backend đã hỗ trợ tìm 'q' bằng ID chưa?)`
            );
            dispatch(clearPendingAction());
            return;
        }

        if (type === "report") {
            openReports(postToOpen.id);
        } else if (type === "review") {
            onOpenDetail(postToOpen);
        }

        dispatch(clearPendingAction());
        dispatch(setQ(""));

        const newParams = new URLSearchParams(searchParams);
        newParams.delete("reportPostId");
        newParams.delete("reviewPostId");
        newParams.delete("q");
        setSearchParams(newParams, { replace: true });
    }, [
        pendingAction,
        posts,
        loadingList,
        dispatch,
        onOpenDetail,
        openReports,
        searchParams,
        setSearchParams,
    ]);

    /* =============== ƯU TIÊN LISTING TYPE KHI CHỜ DUYỆT =============== */
    const sortedPosts = useMemo(() => {
        if (!posts || posts.length === 0) return [];

        // Chỉ ưu tiên trong tab PENDING_REVIEW
        if (selectedTab !== "PENDING_REVIEW") return posts;

        return [...posts].sort((a, b) => {
            const pa = LISTING_REVIEW_PRIORITY[a.listingType] ?? 0;
            const pb = LISTING_REVIEW_PRIORITY[b.listingType] ?? 0;

            // 1. Ưu tiên theo loại: PREMIUM > VIP > NORMAL
            if (pa !== pb) return pb - pa;

            // 2. Nếu cùng loại thì ưu tiên bài tạo sớm hơn (FIFO)
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return ta - tb;
        });
    }, [posts, selectedTab]);

    /* =============== KPI calc =============== */
    const kpi = useMemo(() => {
        const pending = counts.PENDING_REVIEW || 0;
        const published = counts.PUBLISHED || 0;
        const expSoon = counts.EXPIRING_SOON || 0;
        const expired = counts.EXPIRED || 0;
        const hidden = counts.HIDDEN || 0;
        const rejected = counts.REJECTED || 0;
        const total = pending + published + expSoon + expired + hidden + rejected;
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
                    rows={sortedPosts}            // <<< DÙNG LIST ĐÃ SORT
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
                    onReject={reject}
                    onHide={hide}
                    onUnhide={unhide}
                    onHardDelete={hardDelete}
                    onOpenReports={openReports}
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

            {/* Modal xác nhận dùng chung */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                content={confirm.content}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onClose={closeConfirm}
                onConfirm={runConfirm}
            />

            {/* Dialog nhập lý do từ chối */}
            <ConfirmDialog
                open={rejectDlg.open}
                title="Từ chối bài đăng"
                confirmText="Từ chối"
                onClose={closeReject}
                onConfirm={confirmReject}
                confirmDisabled={!rejectDlg.reason.trim() || rejectDlg.reason.trim().length < 5}
                content={
                    <Stack spacing={1}>
                        <Typography sx={{ color: "#475569" }}>
                            Vui lòng nhập <b>lý do từ chối</b> cho tin #{rejectDlg.id}.
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                            Tối thiểu 5 ký tự.
                        </Typography>
                        <TextField
                            autoFocus
                            multiline
                            minRows={3}
                            maxRows={6}
                            placeholder="Nhập lý do..."
                            value={rejectDlg.reason}
                            onChange={(e) =>
                                setRejectDlg((s) => ({ ...s, reason: e.target.value }))
                            }
                            inputProps={{ maxLength: 500 }}
                            FormHelperTextProps={{ sx: { m: 0 } }}
                            helperText={
                                !rejectDlg.reason.trim()
                                    ? "Bắt buộc nhập"
                                    : rejectDlg.reason.trim().length < 5
                                        ? "Vui lòng nhập tối thiểu 5 ký tự"
                                        : " "
                            }
                        />
                    </Stack>
                }
            />

            {/* Dialog gửi cảnh báo */}
            <ConfirmDialog
                open={warningDlg.open}
                title={`Gửi cảnh báo cho tin #${warningDlg.id}`}
                confirmText="Gửi"
                loading={isSendingWarning}
                onClose={closeWarning}
                onConfirm={confirmSendWarning}
                confirmDisabled={
                    !warningDlg.message.trim() || warningDlg.message.trim().length < 10
                }
                TransitionProps={{
                    onExited: handleWarningExited,
                }}
                content={
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        <Typography>Nhập nội dung bạn muốn gửi cho người đăng:</Typography>
                        <TextField
                            autoFocus
                            multiline
                            rows={3}
                            placeholder="Ví dụ: Ảnh của bạn bị mờ, vui lòng cập nhật lại..."
                            value={warningDlg.message}
                            onChange={(e) => {
                                setWarningDlg((s) => ({
                                    ...s,
                                    message: e.target.value,
                                }));
                            }}
                            helperText={
                                warningDlg.message.trim().length < 10
                                    ? "Vui lòng nhập tối thiểu 10 ký tự"
                                    : " "
                            }
                        />
                    </Stack>
                }
            />

            <ReportDetailsModal
                open={reportsModal.open}
                loading={isLoadingReports || isDeletingReports || isSendingWarning}
                postId={reportsModal.postId}
                reports={reportsModal.reports}
                onClose={closeReports}
                onLockPost={handleLockPost}
                onDeleteReports={handleDeleteReports}
                onSendWarning={handleSendWarning}
            />
        </Box>
    );
}
