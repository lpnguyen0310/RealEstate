import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, TextField, Stack, Typography, debounce, MenuItem } from "@mui/material"; // <<< UPDATED
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
    bulkApproveThunk, 
    bulkRejectThunk, 
    setAllSelected,
    toggleSelected,
    clearSelection,
} from "@/store/adminPostsSlice";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSearchParams } from "react-router-dom";
import ReportDetailsModal from "@/components/admidashboard/post/ReportDetailsModal";
import {
    useLazyGetReportsForPostQuery,
    useDeleteSelectedReportsMutation,
    useSendWarningMutation // <<< IMPORT
} from "@/services/reportApiSlice";

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
        selectedIds,
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
            dispatch(setPendingAction({ type: 'report', postId: reportId }));
            // 1. Set Q bằng ID từ thông báo
            if (q !== String(reportId)) {
                dispatch(setQ(String(reportId)));
            }
            // 2. Chuyển sang tab PUBLISHED
            if (selectedTab !== 'PUBLISHED') {
                dispatch(setSelectedTab('PUBLISHED'));
            }
        }
        else if (reviewId) {
            dispatch(setPendingAction({ type: 'review', postId: reviewId }));
            // 1. Set Q bằng ID từ thông báo
            if (q !== String(reviewId)) {
                dispatch(setQ(String(reviewId)));
            }
            // 2. Chuyển sang tab PENDING_REVIEW
            if (selectedTab !== 'PENDING_REVIEW') {
                dispatch(setSelectedTab('PENDING_REVIEW'));
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

    /* =============== FETCH COUNTS (debounce) =============== */
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(fetchCountsThunk());
        }, 250);
        return () => clearTimeout(t);
    }, [dispatch]);

    /* =============== REALTIME WS =============== */
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

                        // 2. SỬA LẠI: Luôn tải lại danh sách
                        await dispatch(fetchPostsThunk());

                    } catch (e) {
                        console.warn("Invalid WS payload:", e);
                    }
                });
            },
        });
        client.activate();
        return () => client.deactivate();

        // SỬA LẠI: Xóa 'selectedTab' khỏi dependency array
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
    const [bulkRejectDlg, setBulkRejectDlg] = useState({ open: false, reason: "" });
    const [bulkApproveDlg, setBulkApproveDlg] = useState({
        open: false,
        listingType: decision.listingType,
        durationDays: decision.durationDays,
    });



    /* =============== ACTIONS =============== */
    const approve = useCallback(
        async (id) => {
            await dispatch(approvePostThunk(id));
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());
        },
        [dispatch]
    );

    // === CHANGED: mở dialog yêu cầu lý do thay vì confirm trống
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
    const [sendWarning, { isLoading: isSendingWarning }] = useSendWarningMutation(); // <<< GỌI HOOK

    const [reportsModal, setReportsModal] = useState({
        open: false,
        postId: null,
        reports: [],
        // loading: false 
    });

    const [warningDlg, setWarningDlg] = useState({ open: false, id: null, message: "" });

    const openReports = useCallback(async (postId) => {
        // Mở modal, nhưng chưa có data, loading sẽ được lấy từ hook
        setReportsModal({ open: true, postId: postId, reports: [] });

        try {
            // === THAY THẾ DATA GIẢ BẰNG CODE THẬT ===

            // Gọi API bằng hook "lazy"
            // .unwrap() sẽ trả về data hoặc throw lỗi
            const data = await triggerGetReports(postId).unwrap();

            // Cập nhật modal với dữ liệu thật
            setReportsModal({ open: true, postId, reports: data });

        } catch (err) {
            console.error("Failed to fetch reports:", err);
            // (Hiển thị message.error ở đây, ví dụ: message.error("Tải báo cáo thất bại"))
            setReportsModal({ open: false, postId: null, reports: [] });
        }
    }, [triggerGetReports]); // <-- Thêm triggerGetReports vào dependency

    const closeReports = useCallback(() => {
        setReportsModal({ open: false, postId: null, reports: [] });
    }, []);

    const handleLockPost = useCallback((postId) => {
        // 1. Đóng modal chi tiết báo cáo
        closeReports();

        // 2. Mở modal "Nhập lý do" (chính là hàm 'reject' của bạn)
        reject(postId);

    }, [reject, closeReports]);

    const handleDeleteReports = useCallback(async (postId, reportIds) => {
        console.log(`Admin yêu cầu xóa ${reportIds.length} báo cáo cho bài: ${postId}`);

        try {
            // 1. Gọi API XÓA
            await deleteReports({ postId, reportIds }).unwrap();

            // 2. (Tùy chọn: Hiển thị thông báo thành công)
            // 3. Tự động đóng modal (Hàm onLockPost/onSendWarning đã làm điều này, nhưng 
            //với hàm này thì nên để ReportDetailsModal tự đóng qua onClose nếu cần)

            // 4. Reload danh sách Posts & Counts để cập nhật `reportCount` (nếu cần)
            await dispatch(fetchCountsThunk());
            await dispatch(fetchPostsThunk());

        } catch (err) {
            console.error("Xóa báo cáo thất bại:", err);
            // (Hiển thị message.error)
        }

        // Lưu ý: Hàm này được gọi từ ReportDetailsModal, modal này sẽ tự đóng sau khi gọi
        // hoặc bạn có thể gọi closeReports() ở đây
        closeReports();

    }, [deleteReports, dispatch, closeReports]);

    const handleSendWarning = useCallback((postId) => {
        // Đóng modal chi tiết, mở modal nhập cảnh báo
        setWarningDlg({ open: true, id: postId, message: "" });
    }, []);

    // 👇 SỬA HÀM NÀY: Chỉ set open: false
    const closeWarning = useCallback(() => {
        setWarningDlg((s) => ({ ...s, open: false }));
    }, []);

    // 🆕 THÊM HÀM MỚI NÀY
    // Hàm này sẽ dọn dẹp state SAU KHI modal đã đóng xong
    const handleWarningExited = useCallback(() => {
        setWarningDlg({ open: false, id: null, message: "" });
    }, []);

    const confirmSendWarning = useCallback(async () => {
        const message = warningDlg.message.trim();
        if (message.length < 10) return; // (Validation cơ bản)

        try {
            await sendWarning({ postId: warningDlg.id, message }).unwrap();

            // (Hiển thị message.success, ví dụ: "Đã gửi cảnh báo")
            closeWarning();

        } catch (err) {
            console.error("Gửi cảnh báo thất bại:", err);
            // (Hiển thị message.error)
        }
    }, [warningDlg, closeWarning, sendWarning]);
    // === (Hết bước 4) ===

    /* =============== XỬ LÝ HÀNH ĐỘNG CHỜ (Mở modal/drawer) =============== */
    useEffect(() => {
        // Guard 1: Phải có hành động đang chờ
        if (!pendingAction) return;

        // Guard 2: BẮT BUỘC CHỜ 'posts' tải xong
        // (Vì chúng ta cần 'posts' đã được lọc bằng 'q' hiển thị ở background)
        if (loadingList || !posts || posts.length === 0) {
            return; // Chờ cho lần render sau khi `posts` tải xong
        }

        const { type, postId } = pendingAction;

        // Tìm post trong danh sách (danh sách này đã được lọc bằng q=postId)
        const postToOpen = posts.find(p => p.id === postId);

        // Guard 3: Phải tìm thấy post
        if (!postToOpen) {
            console.warn(`Pending Action: Không tìm thấy Post #${postId} (Backend đã hỗ trợ tìm 'q' bằng ID chưa?)`);
            dispatch(clearPendingAction()); // Xóa action
            return;
        }

        // Mọi thứ OK -> Thực thi hành động
        if (type === 'report') {
            openReports(postToOpen.id);
        } else if (type === 'review') {
            onOpenDetail(postToOpen);
        }

        // Quan trọng: Xóa action khỏi global state sau khi đã dùng
        dispatch(clearPendingAction());
        dispatch(setQ(""));
        // Và xóa param khỏi URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("reportPostId");
        newParams.delete("reviewPostId");
        newParams.delete("q");
        setSearchParams(newParams, { replace: true });

    }, [
        pendingAction,  // 1. Chạy khi có action
        posts,          // 2. Chạy khi 'posts' thay đổi
        loadingList,    // 3. Chạy khi 'loadingList' thay đổi
        dispatch,
        onOpenDetail,
        openReports,
        searchParams,
        setSearchParams
    ]);

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

    // 2. Tạo các hàm xử lý
    const handleSelectAll = useCallback((event) => {
        if (event.target.checked) {
            // Lọc ra các ID có thể xử lý (ví dụ: chỉ PENDING_REVIEW)
            // Nếu không lọc, dùng posts.map((n) => n.id)
            const selectables = posts
                .filter(p => p.status === 'PENDING_REVIEW') 
                .map((n) => n.id);
            dispatch(setAllSelected(selectables)); // <-- Gọi Redux Action
        } else {
            dispatch(clearSelection()); // <-- Gọi Redux Action
        }
    }, [dispatch, posts]);

    const handleSelectOne = useCallback((id) => {
        dispatch(toggleSelected(id)); // <-- Gọi Redux Action
    }, [dispatch]);

    const openBulkApprove = useCallback(() => {
        if (selectedIds.length === 0) return;
        setBulkApproveDlg({
            open: true,
            // Dùng giá trị mặc định từ Redux decision hoặc hardcode
            listingType: decision.listingType, 
            durationDays: decision.durationDays,
        });
    }, [selectedIds.length, decision.listingType, decision.durationDays]);

    const confirmBulkApprove = useCallback(async () => {
        if (selectedIds.length === 0) return;

        // Chỉ truyền IDs và một ghi chú (nếu cần), BỎ QUA listingType và durationDays.
        // Backend sẽ sử dụng gói tin đã được định nghĩa trong PropertyEntity.
        await dispatch(bulkApproveThunk({
            ids: selectedIds,
            // BỎ QUA listingType và durationDays để Backend tự xử lý theo gói gốc
            note: `Bulk approved by Admin (Retaining original listing type).`, 
        }));

        // Sau khi action thành công
        await dispatch(fetchCountsThunk());
        await dispatch(fetchPostsThunk());
        
        // Đóng dialog
        setBulkApproveDlg(s => ({...s, open: false}));

    }, [dispatch, selectedIds]);


    const openBulkReject = useCallback(() => {
        if (selectedIds.length === 0) return;
        // Mở dialog nhập lý do cho hành động từ chối hàng loạt
        setBulkRejectDlg({ open: true, reason: "" });
    }, [selectedIds.length]);

    const confirmBulkReject = useCallback(async () => {
        const reason = (bulkRejectDlg.reason || "").trim();
        if (selectedIds.length === 0 || reason.length < 5) return;

        // Gửi thunk với data cần thiết
        await dispatch(bulkRejectThunk({
            ids: selectedIds,
            reason: reason,
        }));

        // Sau khi action thành công
        await dispatch(fetchCountsThunk());
        await dispatch(fetchPostsThunk());

        setBulkRejectDlg(s => ({...s, open: false}));

    }, [dispatch, selectedIds, bulkRejectDlg]);

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
                    onReject={reject}           // <<< CHANGED: mở dialog nhập lý do
                    onHide={hide}
                    onUnhide={unhide}
                    onHardDelete={hardDelete}
                    onOpenReports={openReports}
                    money={money}
                    fmtDate={fmtDate}
                    setDecision={(payload) => dispatch(setDecision(payload))}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onBulkApprove={openBulkApprove}
                    onBulkReject={openBulkReject}
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
                    onReject={reject}       // <<< CHANGED: mở dialog nhập lý do
                    actioningId={actioningId}
                    canEditDuration={false}
                />
            </Box>

            {/* === Modal xác nhận dùng chung (giữ nguyên) === */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                content={confirm.content}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onClose={closeConfirm}
                onConfirm={runConfirm}
            />

            {/* === NEW: Dialog bắt buộc nhập lý do từ chối === */}
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
                            onChange={(e) => setRejectDlg((s) => ({ ...s, reason: e.target.value }))}
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

            <ConfirmDialog
                open={warningDlg.open}
                title={`Gửi cảnh báo cho tin #${warningDlg.id}`}
                confirmText="Gửi"
                loading={isSendingWarning} // Dùng state loading
                onClose={closeWarning}
                onConfirm={confirmSendWarning}
                confirmDisabled={!warningDlg.message.trim() || warningDlg.message.trim().length < 10}
                TransitionProps={{
                    onExited: handleWarningExited
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
                                setWarningDlg((s) => ({ ...s, message: e.target.value }))
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
            <ConfirmDialog
                open={bulkRejectDlg.open}
                title={`Từ chối ${selectedIds.length} bài đăng`}
                confirmText={`Từ chối ${selectedIds.length} tin`}
                onClose={() => setBulkRejectDlg(s => ({...s, open: false}))}
                onConfirm={confirmBulkReject}
                confirmDisabled={!bulkRejectDlg.reason.trim() || bulkRejectDlg.reason.trim().length < 5}
                content={
                    <Stack spacing={1}>
                        <Typography sx={{ color: "#475569" }}>
                            Vui lòng nhập <b>lý do từ chối chung</b> cho <b>{selectedIds.length}</b> tin đã chọn.
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                            Tối thiểu 5 ký tự.
                        </Typography>
                        <TextField
                            autoFocus
                            multiline
                            minRows={3}
                            maxRows={6}
                            placeholder="Nhập lý do chung..."
                            value={bulkRejectDlg.reason}
                            onChange={(e) => setBulkRejectDlg((s) => ({ ...s, reason: e.target.value }))}
                            inputProps={{ maxLength: 500 }}
                            helperText={bulkRejectDlg.reason.trim().length < 5 ? "Vui lòng nhập tối thiểu 5 ký tự" : " "}
                        />
                    </Stack>
                }
            />
            
            {/* === NEW: Dialog Duyệt Hàng Loạt (Bulk Approve) === */}
            <ConfirmDialog
                open={bulkApproveDlg.open}
                title={`Duyệt ${selectedIds.length} bài đăng`}
                confirmText={`DUYỆT ${selectedIds.length} TIN`}
                onClose={() => setBulkApproveDlg(s => ({...s, open: false}))}
                onConfirm={confirmBulkApprove}
                // Không cần check durationDays nữa
                confirmDisabled={selectedIds.length === 0} 
                content={
                    <Stack spacing={1}>
                        <Typography>
                            Bạn đang chuẩn bị duyệt **{selectedIds.length}** tin đã chọn.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#0f6b4e' }}>
                            Hệ thống sẽ áp dụng gói tin và thời hạn **đã được người dùng chọn ban đầu** cho từng bài viết.
                        </Typography>
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