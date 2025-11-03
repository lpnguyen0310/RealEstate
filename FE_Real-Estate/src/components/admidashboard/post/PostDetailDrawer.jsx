import { useEffect, useState, useCallback,useMemo } from "react";
import {
    Drawer, Box, Stack, Avatar, Typography, Divider, Chip, Button,
    Card, CardContent, Grid, TextField, Tooltip,Alert, AlertTitle
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { STATUS_LABEL, STATUS_CHIP_COLOR } from "./constants";
import ImageViewer from "./ImageViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";

function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
        </Stack>
    );
}

// helper hiển thị icon/màu cho audit item
function getAuditMeta(type) {
    const t = (type || "").toUpperCase();
    switch (t) {
        case "APPROVED":
            return { color: "success.main", Icon: (p) => <CheckCircleOutlineIcon {...p} />, label: "APPROVED" };
        case "REJECTED":
            return { color: "error.main", Icon: (p) => <HighlightOffOutlinedIcon {...p} />, label: "REJECTED" };
        case "HIDDEN":
            return { color: "warning.main", Icon: (p) => <ArticleOutlinedIcon {...p} />, label: "HIDDEN" };
        case "UNHIDDEN":
        case "UNHIDE":
            return { color: "info.main", Icon: (p) => <ArticleOutlinedIcon {...p} />, label: "UNHIDDEN" };
        default:
            return { color: "text.primary", Icon: (p) => <ArticleOutlinedIcon {...p} />, label: t || "LOG" };
    }
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

    const isPending = detail.status === "PENDING_REVIEW";
    const isRejected = detail.status === "REJECTED";
    const isApprovable = isPending;
    const isRejectable = isPending;

    const resubmitInfo = useMemo(() => {
        // 1. Chỉ kiểm tra nếu tin đang "Chờ duyệt"
        if (!isPending) {
            return { isResubmit: false, fromStatus: null };
        }
        
        // 2. Tìm trong lịch sử (audit) xem có hành động nào
        //    KHÔNG PHẢI là 'APPROVED' (tức là 'REJECTED' hoặc 'WARNED')
        const lastBadAction = (detail.audit || []).find(
            a => (a.type || "").toUpperCase() !== 'APPROVED'
        );

        if (lastBadAction) {
            const type = (lastBadAction.type || "").toUpperCase();
             // 3. Nếu tìm thấy, đánh dấu là "duyệt lại"
             return { isResubmit: true, fromStatus: type };
        }
        
        // 4. Nếu không, đây là tin mới
        return { isResubmit: false, fromStatus: null };

    }, [isPending, detail.audit]);

    const listingChipColor =
        detail.listingType === "VIP" ? "secondary"
            : detail.listingType === "PREMIUM" ? "warning"
                : "info";

    // đồng bộ số ngày theo policy (read-only)
    useEffect(() => {
        if (open && detail?.policyDurationDays && decision.durationDays !== detail.policyDurationDays) {
            setDecision({ durationDays: detail.policyDurationDays });
        }
    }, [open, detail?.policyDurationDays, decision.durationDays, setDecision]);

    // modal xác nhận Từ chối (gọi cha để mở dialog nhập lý do)
    const [rejectConfirm, setRejectConfirm] = useState({ open: false, loading: false });
    const openRejectConfirm = useCallback(() => setRejectConfirm({ open: true, loading: false }), []);
    const closeRejectConfirm = useCallback(() => setRejectConfirm({ open: false, loading: false }), []);
    const doReject = useCallback(async () => {
        try {
            setRejectConfirm((s) => ({ ...s, loading: true }));
            await onReject(detail.id);
            onClose();
        } finally {
            closeRejectConfirm();
        }
    }, [detail?.id, onReject, onClose, closeRejectConfirm]);

    // ưu tiên lý do từ chối từ item (nếu đã bị từ chối), fallback redux decision
    const rejectReasonValue = (detail.rejectReason ?? decision.reason ?? "").toString();

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 650 } }}>
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", fontWeight: 700, width: 48, height: 48 }}>
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

                {resubmitInfo.isResubmit && (
                    <Alert 
                        severity="info" 
                        icon={<InfoOutlinedIcon />} 
                        sx={{ mb: 2, borderRadius: 2 }}
                    >
                        <AlertTitle sx={{ fontWeight: 600 }}>
                            Tin đăng được gửi duyệt lại
                        </AlertTitle>
                        Tin này đã được người dùng cập nhật lại sau khi bị 
                        <b> {resubmitInfo.fromStatus === 'WARNED' ? ' Cảnh báo' : ' Từ chối'}</b>.
                        Vui lòng kiểm tra kỹ các thay đổi.
                    </Alert>
                )}

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
                                            <Chip label={detail.listingType || "NORMAL"} color={listingChipColor} size="small" variant="filled" />
                                        </Tooltip>
                                    }
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Row
                                    label="Trạng thái"
                                    value={<Chip label={STATUS_LABEL[detail.status]} color={STATUS_CHIP_COLOR[detail.status]} size="small" />}
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

                {/* Quyết định duyệt - UI nâng cấp */}
                <Divider sx={{ my: 2 }}>Quyết định duyệt</Divider>

                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "#e3e9f1",
                        bgcolor: "#fafbff",
                        boxShadow: "inset 0 0 4px rgba(0,0,0,0.05)",
                        p: 2.5,
                    }}
                >
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                size="small"
                                label="Thời hạn gói (ngày)"
                                value={`${decision.durationDays || detail?.policyDurationDays || "-"}`}
                                InputProps={{ readOnly: true }}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                size="small"
                                label="Loại tin"
                                value={detail.listingType || "NORMAL"}
                                InputProps={{ readOnly: true }}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label={isRejected ? "Lý do từ chối" : "Lý do từ chối (nhập khi bấm Từ chối)"}
                                value={rejectReasonValue}
                                onChange={(e) => setDecision({ reason: e.target.value })}
                                multiline
                                minRows={3}
                                placeholder={isRejected ? "—" : "Nhập lý do ở bước Từ chối"}
                                fullWidth
                                InputProps={{ readOnly: isRejected }}
                                helperText={
                                    isRejected
                                        ? "Tin đã bị từ chối. Lý do hiển thị ở đây."
                                        : "Lý do sẽ được yêu cầu khi xác nhận Từ chối."
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<CheckCircleOutlineIcon />}
                                    disabled={busy || !isApprovable}
                                    sx={{
                                        px: 3,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        bgcolor: "#2563eb",
                                        "&:hover": { bgcolor: "#1e40af" },
                                    }}
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
                                    disabled={busy || !isRejectable}
                                    sx={{
                                        px: 3,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        borderColor: "#ef4444",
                                        color: "#ef4444",
                                        "&:hover": { bgcolor: "#fee2e2", borderColor: "#dc2626" },
                                    }}
                                    onClick={openRejectConfirm}
                                >
                                    Từ chối
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Card>

                {/* Lịch sử */}
                <Divider sx={{ my: 2 }}>Lịch sử</Divider>
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1.2}>
                            {(detail.audit || []).map((i, idx) => {
                                const { color, Icon, label } = getAuditMeta(i.type);
                                return (
                                    <Card
                                        key={idx}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 1.5,
                                            borderColor: "#e6eaf2",
                                            p: 1.2,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.2,
                                            bgcolor: "#fafafa",
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 18, color }} />
                                        <Box flex={1}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                                                {label}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                {i.message || "Không có ghi chú"}
                                                {i.by ? <>&nbsp;•&nbsp;<em>{i.by}</em></> : null}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: "text.disabled" }}>
                                            {fmtDate ? fmtDate(i.at) : i.at}
                                        </Typography>
                                    </Card>
                                );
                            })}
                            {!(detail.audit || []).length && (
                                <Typography color="text.secondary">Chưa có lịch sử</Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {/* Modal xác nhận từ chối */}
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
