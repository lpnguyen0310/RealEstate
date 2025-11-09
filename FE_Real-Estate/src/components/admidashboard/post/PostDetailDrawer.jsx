// src/components/.../PostDetailDrawer.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Drawer, Box, Stack, Avatar, Typography, Divider, Chip, Button,
    Card, CardContent, Grid, TextField, Tooltip, Alert, AlertTitle,
    IconButton, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { STATUS_LABEL, STATUS_CHIP_COLOR } from "./constants";
import ImageViewer from "./ImageViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";

/* ---------- Row helper ---------- */
function Row({ label, value }) {
    return (
        <Stack direction="row" justifyContent="space-between" gap={2}>
            <Typography sx={{ color: "#6b7280" }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600 }}>
                {typeof value === "string" || typeof value === "number" ? value : value}
            </Typography>
        </Stack>
    );
}

/* ---------- icon/màu cho audit ---------- */
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
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
    const drawerWidth = isXs ? "100vw" : isLgUp ? 740 : isMdUp ? 680 : 600;

    const hasDetail = !!detail;
    const d = detail ?? {};
    const busy = hasDetail && actioningId === d.id;

    const isPending = hasDetail && d.status === "PENDING_REVIEW";
    const isRejected = hasDetail && d.status === "REJECTED";
    const isApprovable = isPending;
    const isRejectable = isPending;

    const resubmitInfo = useMemo(() => {
        if (!hasDetail || !isPending) return { isResubmit: false, fromStatus: null };
        const lastBadAction = (d.audit || []).find((a) => (a.type || "").toUpperCase() !== "APPROVED");
        if (lastBadAction) {
            const type = (lastBadAction.type || "").toUpperCase();
            return { isResubmit: true, fromStatus: type };
        }
        return { isResubmit: false, fromStatus: null };
    }, [hasDetail, isPending, d.audit]);

    const listingChipColor =
        d.listingType === "VIP" ? "secondary"
            : d.listingType === "PREMIUM" ? "warning"
                : "info";

    useEffect(() => {
        if (open && hasDetail && d.policyDurationDays && decision.durationDays !== d.policyDurationDays) {
            setDecision({ durationDays: d.policyDurationDays });
        }
    }, [open, hasDetail, d.policyDurationDays, decision.durationDays, setDecision]);

    const [rejectConfirm, setRejectConfirm] = useState({ open: false, loading: false });
    const openRejectConfirm = useCallback(() => setRejectConfirm({ open: true, loading: false }), []);
    const closeRejectConfirm = useCallback(() => setRejectConfirm({ open: false, loading: false }), []);
    const doReject = useCallback(async () => {
        try {
            setRejectConfirm((s) => ({ ...s, loading: true }));
            if (hasDetail) await onReject(d.id);
            onClose();
        } finally {
            closeRejectConfirm();
        }
    }, [hasDetail, d.id, onReject, onClose, closeRejectConfirm]);

    const rejectReasonValue = ((hasDetail && d.rejectReason) ?? decision.reason ?? "").toString();

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: drawerWidth,
                    ...(isXs
                        ? { height: "100vh", borderRadius: 0, mt: 0, mb: 0, mr: 0, boxShadow: "none" }
                        : { borderRadius: 3, mt: 3, mb: 3, mr: 3, boxShadow: "0 12px 36px rgba(0,0,0,0.14)", maxHeight: "calc(100vh - 48px)" }),
                    overflow: "hidden",
                    display: "flex",
                    bgcolor: "#fff",
                },
            }}
            ModalProps={{
                BackdropProps: { sx: { backgroundColor: "rgba(15,23,42,0.35)", backdropFilter: "blur(3px)" } },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                {/* Header */}
                <Box
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 2,
                        borderBottom: "1px solid #e3e9f5",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        bgcolor: "#fff",
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {isXs && (
                            <IconButton onClick={onClose} size="small">
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                        )}
                        <Avatar sx={{ bgcolor: "#e6f0ff", color: "#3059ff", width: 44, height: 44 }}>
                            <ArticleOutlinedIcon />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700} noWrap title={d.title} sx={{ fontSize: { xs: 15, sm: 16 } }}>
                                {d.title || "—"}
                            </Typography>
                            <Typography fontSize={12} color="#7a8aa1">
                                {hasDetail ? <>#{d.id} • {STATUS_LABEL[d.status]}</> : "Đang tải…"}
                            </Typography>
                        </Box>
                        {!isXs && hasDetail && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => window.open(`/posts/${d.id}`, "_blank")}
                            >
                                Mở trên FE
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 2,
                        pb: { xs: "calc(16px + env(safe-area-inset-bottom))", sm: 2 },
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                    }}
                >
                    {!hasDetail ? (
                        <Typography color="text.secondary">Đang tải chi tiết…</Typography>
                    ) : (
                        <>
                            {resubmitInfo.isResubmit && (
                                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                                    <AlertTitle sx={{ fontWeight: 600 }}>Tin đăng được gửi duyệt lại</AlertTitle>
                                    Tin này đã được người dùng cập nhật lại sau khi bị
                                    <b>{resubmitInfo.fromStatus === "WARNED" ? " Cảnh báo" : " Từ chối"}</b>.
                                </Alert>
                            )}

                            <ImageViewer images={d.images} />

                            <Card sx={{ borderRadius: 2, mt: 2 }}>
                                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={12} sm={6}>
                                            <Row label="Giá" value={money(d.price)} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Row label="Diện tích" value={`${d.area ?? "-"} m²`} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Row
                                                label="Loại tin"
                                                value={
                                                    <Tooltip title="Loại tin do người đăng chọn hoặc theo chính sách gói.">
                                                        <Chip
                                                            label={d.listingType || "NORMAL"}
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
                                                value={<Chip label={STATUS_LABEL[d.status]} color={STATUS_CHIP_COLOR[d.status]} size="small" />}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Row label="Địa chỉ" value={d.displayAddress || "-"} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Row label="Mô tả" value={d.description || "-"} />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Divider sx={{ my: 2 }}>Quyết định duyệt</Divider>

                            <Card
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    borderColor: "#e3e9f1",
                                    bgcolor: "#fafbff",
                                    p: { xs: 1.5, sm: 2.5 },
                                }}
                            >
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            size="small"
                                            label="Thời hạn gói (ngày)"
                                            value={`${decision.durationDays || d?.policyDurationDays || "-"}`}
                                            InputProps={{ readOnly: true }}
                                            fullWidth
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            size="small"
                                            label="Loại tin"
                                            value={d.listingType || "NORMAL"}
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
                                            fullWidth
                                            InputProps={{ readOnly: isRejected }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={2}
                                            justifyContent="flex-end"
                                            alignItems={{ xs: "stretch", sm: "center" }}
                                            sx={{ mt: 1 }}
                                        >
                                            <Button
                                                variant="contained"
                                                startIcon={<CheckCircleOutlineIcon />}
                                                disabled={busy || !isApprovable}
                                                sx={{ px: 3, fontWeight: 600, borderRadius: 2 }}
                                                onClick={() => {
                                                    onApprove(d.id);
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
                                                onClick={openRejectConfirm}
                                            >
                                                Từ chối
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Card>
                        </>
                    )}
                </Box>
            </Box>

            <ConfirmDialog
                open={rejectConfirm.open}
                title="Từ chối bài đăng"
                content={`Bạn chắc chắn muốn từ chối tin #${d.id ?? "?"}?`}
                confirmText="Từ chối"
                loading={rejectConfirm.loading}
                onClose={closeRejectConfirm}
                onConfirm={doReject}
            />
        </Drawer>
    );
}
