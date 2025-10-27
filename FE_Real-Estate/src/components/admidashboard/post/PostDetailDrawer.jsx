import { useEffect, useState, useCallback } from "react";
import {
    Drawer,
    Box,
    Stack,
    Avatar,
    Typography,
    Divider,
    Chip,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { STATUS_LABEL, STATUS_CHIP_COLOR } from "./constants";
import ImageViewer from "./ImageViewer";

// NEW: dùng modal xác nhận chung
import ConfirmDialog from "@/components/common/ConfirmDialog";

function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
    );
}

export default function PostDetailDrawer({
    open,
    onClose,
    detail,
    decision,
    setDecision,
    money,
    fmtDate,
    onApprove,
    onReject,
    actioningId,
}) {
    if (!detail) return null;
    const busy = actioningId === detail.id;

    const listingChipColor =
        detail.listingType === "VIP"
            ? "secondary"
            : detail.listingType === "PREMIUM"
                ? "warning"
                : "info";

    // Khi mở Drawer, đồng bộ số ngày theo policy từ backend (read-only hiển thị)
    useEffect(() => {
        if (
            open &&
            detail?.policyDurationDays &&
            decision.durationDays !== detail.policyDurationDays
        ) {
            setDecision((s) => ({ ...s, durationDays: detail.policyDurationDays }));
        }
        // NOTE: phụ thuộc policyDurationDays, không phải durationDays cũ
    }, [open, detail?.policyDurationDays, decision.durationDays, setDecision]);

    // ===== Modal xác nhận "Từ chối" =====
    const [rejectConfirm, setRejectConfirm] = useState({
        open: false,
        loading: false,
    });

    const openRejectConfirm = useCallback(() => {
        setRejectConfirm({ open: true, loading: false });
    }, []);

    const closeRejectConfirm = useCallback(() => {
        setRejectConfirm({ open: false, loading: false });
    }, []);

    const doReject = useCallback(async () => {
        try {
            setRejectConfirm((s) => ({ ...s, loading: true }));
            await onReject(detail.id); // thunk + refresh ở trên cha
            onClose();                 // đóng Drawer sau khi từ chối thành công
        } finally {
            closeRejectConfirm();
        }
    }, [detail?.id, onReject, onClose, closeRejectConfirm]);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: 650 } }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Avatar
                        sx={{
                            bgcolor: "#e6f0ff",
                            color: "#3059ff",
                            fontWeight: 700,
                            width: 48,
                            height: 48,
                        }}
                    >
                        <ArticleOutlinedIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{detail.title}</Typography>
                        <Typography fontSize={13} color="#7a8aa1">
                            #{detail.id} • {STATUS_LABEL[detail.status]}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(`/posts/${detail.id}`, "_blank")}
                    >
                        Mở trên FE
                    </Button>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Hình ảnh */}
                <ImageViewer images={detail.images} />

                {/* Thông tin chính */}
                <Card sx={{ borderRadius: 2, mt: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                                <Row label="Giá" value={money(detail.price)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Row label="Diện tích" value={`${detail.area ?? "-"} m²`} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Row
                                    label="Loại tin"
                                    value={
                                        <Tooltip title="Loại tin do người đăng chọn hoặc theo chính sách gói.">
                                            <Chip
                                                label={detail.listingType || "NORMAL"}
                                                color={listingChipColor}
                                                size="small"
                                                variant="filled"
                                            />
                                        </Tooltip>
                                    }
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Row
                                    label="Trạng thái"
                                    value={
                                        <Chip
                                            label={STATUS_LABEL[detail.status]}
                                            color={STATUS_CHIP_COLOR[detail.status]}
                                            size="small"
                                        />
                                    }
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Row label="Địa chỉ" value={detail.displayAddress || "-"} />
                            </Grid>
                            <Grid item xs={12}>
                                <Row label="Mô tả" value={detail.description || "-"} />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 2 }}>Quyết định duyệt</Divider>

                {/* Quyết định duyệt */}
                <Grid container spacing={2}>
                    {/* Thời hạn gói (read-only) */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            size="small"
                            label="Thời hạn gói (ngày)"
                            value={`${decision.durationDays || detail?.policyDurationDays || "-"}`}
                            InputProps={{ readOnly: true }}
                            fullWidth
                        />
                    </Grid>

                    {/* Loại tin (read-only) */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            size="small"
                            label="Loại tin"
                            value={detail.listingType || "NORMAL"}
                            InputProps={{ readOnly: true }}
                            fullWidth
                        />
                    </Grid>

                    {/* Lý do từ chối */}
                    <Grid item xs={12}>
                        <TextField
                            label="Lý do từ chối (không bắt buộc)"
                            value={decision.reason || ""}
                            onChange={(e) =>
                                setDecision((s) => ({ ...s, reason: e.target.value }))
                            }
                            multiline
                            minRows={3}
                            placeholder="Có thể để trống"
                            fullWidth
                        />
                    </Grid>

                    {/* Nút hành động */}
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button
                                variant="contained"
                                startIcon={<CheckCircleOutlineIcon />}
                                disabled={busy}
                                onClick={() => {
                                    onApprove(detail.id);
                                    onClose();
                                }}
                            >
                                Duyệt
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<HighlightOffOutlinedIcon />}
                                disabled={busy}
                                onClick={openRejectConfirm} // mở modal xác nhận
                            >
                                Từ chối
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>

                {/* Lịch sử duyệt */}
                <Divider sx={{ my: 2 }}>Lịch sử</Divider>
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1}>
                            {(detail.audit || []).map((i, idx) => (
                                <Typography key={idx} fontSize={14}>
                                    <strong>{i.at}</strong> • <em>{i.by}</em>: {i.message || i.type}
                                </Typography>
                            ))}
                            {!(detail.audit || []).length && (
                                <Typography color="text.secondary">Chưa có lịch sử</Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* ===== Modal xác nhận từ chối ===== */}
            <ConfirmDialog
                open={rejectConfirm.open}
                title="Từ chối bài đăng"
                content={`Bạn chắc chắn muốn từ chối tin #${detail.id}?`}
                confirmText="Từ chối"
                loading={rejectConfirm.loading}
                onClose={closeRejectConfirm}
                onConfirm={doReject}
            />
        </Drawer>
    );
}
