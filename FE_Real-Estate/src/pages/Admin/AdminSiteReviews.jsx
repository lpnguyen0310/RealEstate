// src/pages/Admin/AdminSiteReviews.jsx
import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Typography,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Grid,
} from "@mui/material";
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import SiteReviewsTable from "../../components/admidashboard/reviews/SiteReviewsTable";
import adminSiteReviewApi from "../../api/adminApi/adminSiteReviewApi";
import StatCard from "../../components/admidashboard/reviews/StatCard";
import SentimentFilterBar from "../../components/admidashboard/reviews/SentimentFilterBar";
import ReviewSummaryPanel from "../../components/admidashboard/reviews/ReviewSummaryPanel";

// Helper FE: xác định sentiment từ rating (dùng cho thống kê UI)
const getSentiment = (rating = 0) => {
    if (rating >= 4) return "POSITIVE"; // đánh giá tốt
    if (rating <= 2) return "NEGATIVE"; // đánh giá xấu
    return "NEUTRAL"; // trung lập (3★)
};

export default function AdminSiteReviews() {
    const [searchParams, setSearchParams] = useSearchParams();

    // ===== Lấy giá trị ban đầu từ URL =====
    const initialPage = (() => {
        const p = parseInt(searchParams.get("page") || "1", 10);
        return Number.isNaN(p) || p <= 0 ? 1 : p;
    })();

    const initialPageSize = (() => {
        const s = parseInt(searchParams.get("size") || "10", 10);
        return Number.isNaN(s) || s <= 0 ? 10 : s;
    })();

    const initialStatus = searchParams.get("status") || "";
    const initialSentiment = searchParams.get("sentiment") || "";

    const [rows, setRows] = useState([]);

    // filter
    const [statusFilter, setStatusFilter] = useState(initialStatus); // "", "PUBLISHED", "HIDDEN"
    const [sentimentFilter, setSentimentFilter] = useState(initialSentiment); // "", "POSITIVE", "NEUTRAL", "NEGATIVE"

    // paging (server-side)
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);

    // GLOBAL stats cho StatCard (từ BE)
    const [globalStats, setGlobalStats] = useState({
        total: 0,
        published: 0,
        hidden: 0,
        newToday: 0,
    });

    // force reload sau khi update
    const [reloadKey, setReloadKey] = useState(0);

    // Dialog xác nhận
    const [confirmState, setConfirmState] = useState({
        open: false,
        type: "", // 'show' | 'hide' | 'delete'
        target: null,
        processing: false,
    });

    const openConfirm = (type, target) => {
        setConfirmState({ open: true, type, target, processing: false });
    };

    const closeConfirm = () => {
        if (confirmState.processing) return;
        setConfirmState({ open: false, type: "", target: null, processing: false });
    };

    const confirmTitle = (() => {
        if (confirmState.type === "hide") return "Ẩn đánh giá này?";
        if (confirmState.type === "show") return "Hiển thị lại đánh giá này?";
        if (confirmState.type === "delete") return "Xoá đánh giá này?";
        return "";
    })();

    const confirmText = (() => {
        const name = confirmState.target?.userName || "người dùng";
        if (confirmState.type === "hide")
            return `Đánh giá của "${name}" sẽ không còn hiển thị trên trang người dùng.`;
        if (confirmState.type === "show")
            return `Đánh giá của "${name}" sẽ được hiển thị lại trên trang người dùng.`;
        if (confirmState.type === "delete")
            return `Đánh giá của "${name}" sẽ bị xoá vĩnh viễn khỏi hệ thống.`;
        return "";
    })();

    const handleConfirmAction = async () => {
        const { type, target } = confirmState;
        if (!target) return;

        setConfirmState((p) => ({ ...p, processing: true }));

        try {
            await adminSiteReviewApi.updateStatus(target.id, type);
            setReloadKey((k) => k + 1); // reload list
        } catch (err) {
            console.error("Lỗi update:", err);
        } finally {
            closeConfirm();
        }
    };

    // ===== Đồng bộ state -> URL query (page, size, status, sentiment) =====
    useEffect(() => {
        const params = new URLSearchParams();

        if (page && page !== 1) params.set("page", String(page));
        if (pageSize && pageSize !== 10) params.set("size", String(pageSize));
        if (statusFilter) params.set("status", statusFilter);
        if (sentimentFilter) params.set("sentiment", sentimentFilter);

        setSearchParams(params);
    }, [page, pageSize, statusFilter, sentimentFilter, setSearchParams]);

    // ===== Load list + global stats (status + sentiment đều gửi xuống BE) =====
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [listRes, statsRes] = await Promise.all([
                    adminSiteReviewApi.getReviews({
                        page,
                        size: pageSize,
                        status: statusFilter,
                        sentiment: sentimentFilter,
                    }),
                    adminSiteReviewApi.getStats(),
                ]);

                const data = listRes.data;

                setRows(data.content || []);
                setTotalItems(data.totalElements ?? 0);
                setTotalPages(data.totalPages ?? 1);

                setGlobalStats(
                    statsRes.data || {
                        total: 0,
                        published: 0,
                        hidden: 0,
                        newToday: 0,
                    }
                );
            } catch (err) {
                console.error("Lỗi khi load review:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [page, pageSize, statusFilter, sentimentFilter, reloadKey]);

    // Đếm sentiment trên TRANG HIỆN TẠI (sau khi BE đã filter status + sentiment)
    const sentimentCounts = useMemo(() => {
        const base = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
        (rows || []).forEach((r) => {
            const s = getSentiment(r.rating || 0);
            base[s] = (base[s] || 0) + 1;
        });
        return base;
    }, [rows]);

    // Stats theo rows (page hiện tại + filter BE)
    const totalReviews = rows.length;
    const avgRating =
        totalReviews === 0
            ? 0
            : rows.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;

    const ratingStats = [5, 4, 3, 2, 1].map((star) => {
        const count = rows.filter(
            (r) => Math.round(r.rating || 0) === star
        ).length;
        return { star, count };
    });

    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

    // Handlers truyền xuống bảng
    const handleRequestShow = (row) => openConfirm("show", row);
    const handleRequestHide = (row) => openConfirm("hide", row);
    const handleRequestDelete = (row) => openConfirm("delete", row);

    // Handler đổi page & pageSize nếu muốn custom (optional)
    const handleChangePage = (newPage) => {
        setPage(newPage);
        // Không cần set URL ở đây, useEffect sync rồi
    };

    const handleChangePageSize = (newSize) => {
        setPageSize(newSize);
        setPage(1);
    };

    return (
        <Box p={{ xs: 2, md: 3 }}>
            {/* Header */}
            <Box
                mb={2.5}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
            >
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Quản lý đánh giá trải nghiệm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Xem, phân loại đánh giá tốt/xấu, ẩn/hiện hoặc xoá các đánh giá mà
                        người dùng gửi về trang web.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="review-status-filter-label">Trạng thái</InputLabel>
                        <Select
                            labelId="review-status-filter-label"
                            label="Trạng thái"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <MenuItem value="">
                                <em>Tất cả</em>
                            </MenuItem>
                            <MenuItem value="PUBLISHED">Hiển thị</MenuItem>
                            <MenuItem value="HIDDEN">Đã ẩn</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {/* GLOBAL stats */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Tổng đánh giá"
                        value={globalStats.total}
                        icon={MessageSquare}
                        color="#3b82f6"
                        subText={`+${globalStats.newToday} đánh giá mới hôm nay`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Đã công khai"
                        value={globalStats.published}
                        icon={CheckCircle2}
                        color="#10b981"
                        subText="Hiển thị trên website"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Đã ẩn / Spam"
                        value={globalStats.hidden}
                        icon={AlertCircle}
                        color="#ef4444"
                        subText="Cần xem xét lại"
                    />
                </Grid>
            </Grid>

            {/* Thanh filter tốt/xấu (lọc BE) */}
            <SentimentFilterBar
                sentimentFilter={sentimentFilter}
                onChangeSentiment={(val) => {
                    setSentimentFilter(val); // "", "POSITIVE", "NEUTRAL", "NEGATIVE"
                    setPage(1);
                }}
                totalCount={rows.length}
                counts={sentimentCounts}
            />

            {/* Summary panel (trang hiện tại + filter BE) */}
            <ReviewSummaryPanel
                avgRating={avgRating}
                totalReviews={totalReviews}
                ratingStats={ratingStats}
            />

            {/* Table */}
            <SiteReviewsTable
                rows={rows}
                page={page}
                totalPages={totalPages}
                start={start}
                end={end}
                totalItems={totalItems}
                pageSize={pageSize}
                setPage={handleChangePage}
                setPageSize={handleChangePageSize}
                onShow={handleRequestShow}
                onHide={handleRequestHide}
                onDelete={handleRequestDelete}
                loading={loading}
            />

            {/* Dialog xác nhận */}
            <Dialog open={confirmState.open} onClose={closeConfirm} maxWidth="xs" fullWidth>
                <DialogTitle>{confirmTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{confirmText}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm} disabled={confirmState.processing}>
                        Huỷ
                    </Button>
                    <Button
                        variant="contained"
                        color={confirmState.type === "delete" ? "error" : "primary"}
                        onClick={handleConfirmAction}
                        disabled={confirmState.processing}
                    >
                        {confirmState.processing ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
