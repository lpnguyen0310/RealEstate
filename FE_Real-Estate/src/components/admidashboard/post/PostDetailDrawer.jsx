// src/components/.../PostDetailDrawer.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
    Drawer,
    Box,
    Stack,
    Avatar,
    Typography,
    Chip,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Tooltip,
    Alert,
    AlertTitle,
    IconButton,
    useMediaQuery,
    Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import BathtubOutlinedIcon from "@mui/icons-material/BathtubOutlined";
import StairsOutlinedIcon from "@mui/icons-material/StairsOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import { STATUS_LABEL, STATUS_CHIP_COLOR } from "./constants";
import ImageViewer from "./ImageViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// ✅ NEW: amenity API
import { amenityApi } from "@/api/amenityApi";

/* ---------- helpers ---------- */
function safeText(v, fallback = "-") {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "string" && !v.trim()) return fallback;
    return v;
}
function numOrDash(v) {
    return v === null || v === undefined ? "-" : v;
}
function m2(v) {
    return v === null || v === undefined ? "-" : `${v} m²`;
}
function dim(v) {
    return v === null || v === undefined ? "-" : `${v} m`;
}
function clampText(v, max = 180) {
    const s = (v ?? "").toString();
    if (s.length <= max) return { text: s, clamped: false };
    return { text: s.slice(0, max).trimEnd() + "…", clamped: true };
}
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/* ---------- tiny UI tokens ---------- */
const softShadow = "0 14px 34px rgba(15,23,42,0.08)";
const softBorder = "1px solid #e6edf7";
const cardSx = {
    borderRadius: 3,
    border: softBorder,
    boxShadow: softShadow,
    overflow: "hidden",
};
const sectionTitleSx = {
    fontWeight: 950,
    color: "#0f172a",
    letterSpacing: "-0.02em",
};

/* ---------- mini Field + SubBlock ---------- */
function Field({ label, value, icon: Icon, accent }) {
    return (
        <Box
            sx={{
                p: 1.35,
                borderRadius: 2.5,
                border: "1px solid #e6edf7",
                bgcolor: "#fff",
                boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                height: "100%",
            }}
        >
            <Stack direction="row" spacing={1.1} alignItems="flex-start">
                {Icon ? (
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            bgcolor: "rgba(37,99,235,0.10)",
                            color: accent || "#2563eb",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        <Icon sx={{ fontSize: 20 }} />
                    </Box>
                ) : null}

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            mt: 0.4,
                            fontSize: 15.5,
                            fontWeight: 950,
                            color: "#0f172a",
                            lineHeight: 1.25,
                            wordBreak: "break-word",
                        }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

function SubBlock({ title, icon: Icon, action, children }) {
    return (
        <Box
            sx={{
                mt: 1.6,
                p: 1.6,
                borderRadius: 3,
                border: "1px solid #e6edf7",
                bgcolor: "rgba(2,6,23,0.02)",
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {Icon ? <Icon sx={{ color: "#64748b" }} /> : null}
                    <Typography sx={{ fontWeight: 1000, color: "#0f172a" }}>{title}</Typography>
                </Stack>
                {action}
            </Stack>
            {children}
        </Box>
    );
}

/* ---------- Quick stat card ---------- */
function Stat({ icon: Icon, label, value }) {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2.5,
                borderColor: "#e6edf7",
                bgcolor: "#fff",
            }}
        >
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "rgba(37,99,235,0.10)",
                            color: "#2563eb",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        <Icon sx={{ fontSize: 20 }} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize: 16, color: "#0f172a", fontWeight: 950, lineHeight: 1.1 }}>
                            {value}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

/* ---------- Audit meta ---------- */
function getAuditUI(type) {
    const t = (type || "").toUpperCase();
    switch (t) {
        case "APPROVED":
            return { label: "Đã duyệt", color: "#16a34a", bg: "rgba(22,163,74,0.10)", Icon: CheckCircleOutlineIcon };
        case "REJECTED":
            return { label: "Đã từ chối", color: "#dc2626", bg: "rgba(220,38,38,0.10)", Icon: HighlightOffOutlinedIcon };
        case "WARNED":
        case "WARNING":
            return { label: "Cảnh báo", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: InfoOutlinedIcon };
        case "HIDDEN":
            return { label: "Đã ẩn", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: ArticleOutlinedIcon };
        case "UNHIDDEN":
        case "UNHIDE":
            return { label: "Bỏ ẩn", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)", Icon: ArticleOutlinedIcon };
        default:
            return { label: t || "LOG", color: "#334155", bg: "rgba(51,65,85,0.08)", Icon: ArticleOutlinedIcon };
    }
}

/* ---------- Timeline ---------- */
function AuditTimeline({ items = [], fmtDate }) {
    if (!items.length) {
        return (
            <Stack alignItems="center" sx={{ py: 4 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        bgcolor: "rgba(148,163,184,0.12)",
                        color: "#64748b",
                        display: "grid",
                        placeItems: "center",
                        mb: 1,
                    }}
                >
                    <HistoryOutlinedIcon />
                </Box>
                <Typography sx={{ color: "#64748b", fontWeight: 800 }}>Chưa có lịch sử</Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
            {items.map((i, idx) => {
                const ui = getAuditUI(i.type);
                const isLast = idx === items.length - 1;
                const isFirst = idx === 0;
                const Icon = ui.Icon;

                return (
                    <Box key={idx} sx={{ display: "flex", gap: 1.5 }}>
                        <Box sx={{ width: 30, display: "flex", justifyContent: "center" }}>
                            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "999px",
                                        bgcolor: ui.bg,
                                        color: ui.color,
                                        display: "grid",
                                        placeItems: "center",
                                        border: "1px solid rgba(15,23,42,0.08)",
                                        boxShadow: isFirst ? "0 0 0 7px rgba(37,99,235,0.12)" : "none",
                                    }}
                                >
                                    <Icon sx={{ fontSize: 18 }} />
                                </Box>

                                {!isLast && (
                                    <Box
                                        sx={{
                                            width: 2,
                                            flex: 1,
                                            bgcolor: "#e2e8f0",
                                            mt: 0.7,
                                            mb: -0.2,
                                            borderRadius: 999,
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>

                        <Card
                            variant="outlined"
                            sx={{
                                flex: 1,
                                borderRadius: 2.5,
                                borderColor: "#e6edf7",
                                bgcolor: "#fff",
                            }}
                        >
                            <CardContent sx={{ py: 1.4, "&:last-child": { pb: 1.4 } }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    gap={1}
                                >
                                    <Stack spacing={0.3}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography sx={{ fontWeight: 950, color: ui.color }}>{ui.label}</Typography>

                                            {i.by && (
                                                <Chip
                                                    size="small"
                                                    label={i.by}
                                                    variant="outlined"
                                                    sx={{
                                                        height: 22,
                                                        fontWeight: 900,
                                                        bgcolor: "rgba(15,23,42,0.02)",
                                                        borderColor: "#e6edf7",
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        <Typography variant="body2" sx={{ color: "#475569" }}>
                                            {i.message || "Không có ghi chú"}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "#94a3b8",
                                            whiteSpace: "nowrap",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {fmtDate ? fmtDate(i.at) : i.at}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                );
            })}
        </Stack>
    );
}

/* ---------- Section wrapper ---------- */
function Section({ title, icon: Icon, children, subtitle }) {
    return (
        <Card sx={{ ...cardSx, mt: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2.2,
                            bgcolor: "rgba(15,23,42,0.04)",
                            color: "#0f172a",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        {Icon ? <Icon sx={{ fontSize: 20 }} /> : null}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ ...sectionTitleSx, fontSize: 16 }}>{title}</Typography>
                        {subtitle ? (
                            <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{subtitle}</Typography>
                        ) : null}
                    </Box>
                </Stack>

                {children}
            </CardContent>
        </Card>
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
    canEditDuration = false,
}) {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
    const drawerWidth = isXs ? "100vw" : isLgUp ? 760 : isMdUp ? 700 : 620;

    const hasDetail = !!detail;
    const d = detail ?? {};
    const busy = hasDetail && actioningId === d.id;

    const isPending = hasDetail && d.status === "PENDING_REVIEW";
    const isRejected = hasDetail && d.status === "REJECTED";
    const isApprovable = isPending;
    const isRejectable = isPending;

    const canOpenPublic =
        hasDetail && ["PUBLISHED", "EXPIRING_SOON", "EXPIRED", "EXPIRINGSOON"].includes(d.status);

    const listingChipColor =
        d.listingType === "VIP" ? "secondary" : d.listingType === "PREMIUM" ? "warning" : "info";

    const resubmitInfo = useMemo(() => {
        if (!hasDetail || !isPending) return { isResubmit: false, fromStatus: null };
        const lastBadAction = (d.audit || []).find((a) => (a.type || "").toUpperCase() !== "APPROVED");
        if (lastBadAction) {
            const type = (lastBadAction.type || "").toUpperCase();
            return { isResubmit: true, fromStatus: type };
        }
        return { isResubmit: false, fromStatus: null };
    }, [hasDetail, isPending, d.audit]);

    useEffect(() => {
        const policy = d.policyDurationDays ?? d.durationDays;
        if (open && hasDetail && policy && decision?.durationDays !== policy) {
            setDecision({ durationDays: policy });
        }
    }, [open, hasDetail, d.policyDurationDays, d.durationDays, decision?.durationDays, setDecision]);

    const [rejectConfirm, setRejectConfirm] = useState({ open: false, loading: false });
    const openRejectConfirm = useCallback(() => setRejectConfirm({ open: true, loading: false }), []);
    const closeRejectConfirm = useCallback(() => setRejectConfirm({ open: false, loading: false }), []);

    const [descExpanded, setDescExpanded] = useState(false);
    useEffect(() => setDescExpanded(false), [d?.id]);

    const { text: descShort, clamped: descClamped } = useMemo(
        () => clampText(d.description, 220),
        [d.description]
    );

    const rejectReasonValue = ((hasDetail && d.rejectReason) ?? decision?.reason ?? "").toString();
    const warningMessage = d.latestWarningMessage ?? d.LatestWarningMessage ?? null;

    const [copied, setCopied] = useState(false);
    const doCopyAddress = useCallback(async () => {
        const text = (d.displayAddress || d.addressStreet || d.position || "").toString();
        if (!text) return;
        const ok = await copyToClipboard(text);
        setCopied(ok);
        setTimeout(() => setCopied(false), 1200);
    }, [d.displayAddress, d.addressStreet, d.position]);

    const doReject = useCallback(async () => {
        try {
            setRejectConfirm((s) => ({ ...s, loading: true }));
            if (hasDetail) await onReject(d.id);
            onClose();
        } finally {
            closeRejectConfirm();
        }
    }, [hasDetail, d.id, onReject, onClose, closeRejectConfirm]);

    // ===== NEW: scroll + highlight reject reason field =====
    const rejectReasonBlockRef = useRef(null);
    const rejectReasonInputRef = useRef(null);
    const [highlightReject, setHighlightReject] = useState(false);

    const goToRejectReason = useCallback(() => {
        closeRejectConfirm();

        setTimeout(() => {
            const el = rejectReasonBlockRef.current;
            if (el?.scrollIntoView) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            setTimeout(() => {
                rejectReasonInputRef.current?.focus?.();
                setHighlightReject(true);
                setTimeout(() => setHighlightReject(false), 1600);
            }, 180);
        }, 120);
    }, [closeRejectConfirm]);

    // ✅ NEW: load amenity list -> map id => name
    const [amenityMap, setAmenityMap] = useState({});
    useEffect(() => {
        let mounted = true;

        amenityApi
            .getAll()
            .then((list) => {
                if (!mounted) return;
                const map = {};
                (list || []).forEach((a) => {
                    // support {id,name} or {amenityId,amenityName} if BE differs
                    const id = a?.id ?? a?.amenityId;
                    const name = a?.name ?? a?.amenityName ?? a?.title;
                    if (id != null) map[id] = name || `Tiện ích #${id}`;
                });
                setAmenityMap(map);
            })
            .catch(() => {
                // nếu lỗi thì vẫn render fallback theo id
                if (!mounted) return;
                setAmenityMap({});
            });

        return () => {
            mounted = false;
        };
    }, []);

    const amenityLabels = useMemo(() => {
        const ids = Array.isArray(d.amenityIds) ? d.amenityIds : [];
        return ids.map((id) => ({
            id,
            label: amenityMap[id] || `Tiện ích #${id}`,
        }));
    }, [d.amenityIds, amenityMap]);

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
                        : {
                            borderRadius: 3,
                            mt: 3,
                            mb: 3,
                            mr: 3,
                            boxShadow: "0 16px 50px rgba(0,0,0,0.18)",
                            maxHeight: "calc(100vh - 48px)",
                        }),
                    overflow: "hidden",
                    display: "flex",
                    bgcolor: "#fff",
                },
            }}
            ModalProps={{
                BackdropProps: {
                    sx: {
                        backgroundColor: "rgba(15,23,42,0.42)",
                        backdropFilter: "blur(4px)",
                    },
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
                {/* ===== Hero Header ===== */}
                <Box
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 2,
                        borderBottom: "1px solid #e6edf7",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        bgcolor: "#fff",
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {isXs && (
                            <IconButton onClick={onClose} size="small">
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                        )}

                        <Avatar
                            sx={{
                                width: 46,
                                height: 46,
                                color: "#fff",
                                background: "linear-gradient(135deg,#4f46e5,#2563eb)",
                                boxShadow: "0 10px 22px rgba(37,99,235,0.28)",
                            }}
                        >
                            <ArticleOutlinedIcon />
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                noWrap
                                title={d.title}
                                sx={{
                                    fontWeight: 950,
                                    fontSize: { xs: 15, sm: 16.5 },
                                    color: "#0f172a",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {hasDetail ? d.title || "—" : <Skeleton width={220} />}
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.4 }}>
                                {hasDetail ? (
                                    <>
                                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                            #{d.id}
                                        </Typography>

                                        <Chip
                                            size="small"
                                            label={STATUS_LABEL[d.status] ?? d.status}
                                            color={STATUS_CHIP_COLOR?.[d.status] ?? "default"}
                                            sx={{ fontWeight: 900, height: 22 }}
                                        />

                                        <Chip
                                            size="small"
                                            label={d.listingType || "NORMAL"}
                                            color={listingChipColor}
                                            variant="filled"
                                            sx={{ fontWeight: 900, height: 22 }}
                                        />

                                        {d.categoryName ? (
                                            <Chip
                                                size="small"
                                                label={d.categoryName}
                                                variant="outlined"
                                                sx={{
                                                    height: 22,
                                                    fontWeight: 850,
                                                    borderColor: "#e6edf7",
                                                    bgcolor: "rgba(15,23,42,0.02)",
                                                }}
                                            />
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <Skeleton width={90} height={26} />
                                        <Skeleton width={70} height={26} />
                                        <Skeleton width={120} height={26} />
                                    </>
                                )}
                            </Stack>
                        </Box>

                        {!isXs && hasDetail && canOpenPublic && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => window.open(`/real-estate/${d.id}`, "_blank")}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, borderColor: "#e6edf7" }}
                            >
                                Mở public
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* ===== Content ===== */}
                <Box
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 2,
                        pb: { xs: "calc(90px + env(safe-area-inset-bottom))", sm: 12 },
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        bgcolor: "#fff",
                    }}
                >
                    {!hasDetail ? (
                        <Stack spacing={2}>
                            <Skeleton variant="rounded" height={220} />
                            <Skeleton variant="rounded" height={180} />
                            <Skeleton variant="rounded" height={180} />
                            <Skeleton variant="rounded" height={180} />
                        </Stack>
                    ) : (
                        <>
                            {resubmitInfo.isResubmit && (
                                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2, borderRadius: 2.5 }}>
                                    <AlertTitle sx={{ fontWeight: 950 }}>Tin đăng được gửi duyệt lại</AlertTitle>
                                    Tin này đã được người dùng cập nhật lại sau khi bị
                                    <b>{resubmitInfo.fromStatus === "WARNED" ? " Cảnh báo" : " Từ chối"}</b>.
                                </Alert>
                            )}

                            {warningMessage && (
                                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>
                                    <AlertTitle sx={{ fontWeight: 950 }}>Cảnh báo gần nhất</AlertTitle>
                                    {warningMessage}
                                </Alert>
                            )}

                            {/* Images */}
                            <Card sx={{ ...cardSx, mt: 0 }}>
                                <CardContent sx={{ p: { xs: 1, sm: 1.2 } }}>
                                    <ImageViewer images={d.images || d.imageUrls || []} />
                                </CardContent>
                            </Card>

                            {/* Quick stats */}
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={1.2}>
                                    <Grid item xs={6} md={3}>
                                        <Stat icon={VisibilityOutlinedIcon} label="Lượt xem" value={numOrDash(d.viewCount)} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Stat icon={FavoriteBorderOutlinedIcon} label="Yêu thích" value={numOrDash(d.favoriteCount)} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Stat icon={TrendingUpOutlinedIcon} label="Tương tác" value={numOrDash(d.interactionCount)} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Stat icon={ReportOutlinedIcon} label="Báo cáo" value={numOrDash(d.reportCount)} />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Basic info */}
                            <Section title="Thông tin cơ bản" icon={ArticleOutlinedIcon} subtitle="Giá • Diện tích • Loại BĐS • Pháp lý">
                                <Grid container spacing={1.2}>
                                    <Grid item xs={12} md={6}>
                                        <Field label="Giá" value={money ? money(d.price) : safeText(d.price)} icon={ArticleOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Field label="Loại giá" value={safeText(d.priceType)} icon={InfoOutlinedIcon} />
                                    </Grid>

                                    <Grid item xs={6} md={3}>
                                        <Field label="Diện tích" value={m2(d.area)} icon={SquareFootOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Diện tích đất" value={m2(d.landArea)} icon={SquareFootOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Phòng ngủ" value={numOrDash(d.bedrooms)} icon={BedOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Phòng tắm" value={numOrDash(d.bathrooms)} icon={BathtubOutlinedIcon} />
                                    </Grid>

                                    <Grid item xs={6} md={3}>
                                        <Field label="Số tầng" value={numOrDash(d.floors)} icon={StairsOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Hướng" value={safeText(d.direction)} icon={ExploreOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Ngang" value={dim(d.width)} icon={StraightenOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Field label="Dài" value={dim(d.height)} icon={StraightenOutlinedIcon} />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Field label="Loại BĐS" value={safeText(d.propertyType)} icon={HomeWorkOutlinedIcon} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Field label="Pháp lý" value={safeText(d.legalStatus)} icon={GavelOutlinedIcon} />
                                    </Grid>


                                    <Grid item xs={12} md={6}>
                                        <Field
                                            label="Loại tin"
                                            value={
                                                <Chip
                                                    label={d.listingType || "NORMAL"}
                                                    color={listingChipColor}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{ fontWeight: 950 }}
                                                />
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Field
                                            label="Trạng thái"
                                            value={
                                                <Chip
                                                    label={STATUS_LABEL[d.status] ?? d.status}
                                                    color={STATUS_CHIP_COLOR?.[d.status] ?? "default"}
                                                    size="small"
                                                    sx={{ fontWeight: 950 }}
                                                />
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Field
                                            label="Ngày đăng"
                                            value={fmtDate ? fmtDate(d.createdAt ?? d.postedAt) : safeText(d.createdAt ?? d.postedAt)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Field label="Hết hạn" value={fmtDate ? fmtDate(d.expiresAt) : safeText(d.expiresAt)} />
                                    </Grid>
                                </Grid>

                                <SubBlock
                                    title="Địa chỉ"
                                    icon={LocationOnOutlinedIcon}
                                    action={
                                        <Tooltip title={copied ? "Đã copy!" : "Copy địa chỉ"}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={doCopyAddress}
                                                    disabled={!((d.displayAddress || d.addressStreet || d.position) ?? "").toString().trim()}
                                                    sx={{ border: "1px solid #e6edf7", borderRadius: 2, bgcolor: "#fff" }}
                                                >
                                                    <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    }
                                >
                                    <Grid container spacing={1.2}>
                                        <Grid item xs={12} md={8}>
                                            <Field label="Địa chỉ hiển thị" value={safeText(d.displayAddress)} />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Field label="Vị trí" value={safeText(d.position)} />
                                        </Grid>
                                    </Grid>
                                </SubBlock>

                                <SubBlock
                                    title="Mô tả"
                                    action={
                                        descClamped ? (
                                            <Button
                                                size="small"
                                                onClick={() => setDescExpanded((v) => !v)}
                                                endIcon={descExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                sx={{ textTransform: "none", fontWeight: 950, borderRadius: 2 }}
                                            >
                                                {descExpanded ? "Thu gọn" : "Xem thêm"}
                                            </Button>
                                        ) : null
                                    }
                                >
                                    <Typography sx={{ color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                        {descExpanded ? safeText(d.description) : safeText(descShort)}
                                    </Typography>
                                </SubBlock>
                            </Section>

                            {/* ✅ NEW Amenities Section */}
                            <Section title="Tiện ích" icon={InfoOutlinedIcon} subtitle="Các tiện ích đi kèm bất động sản">
                                {(Array.isArray(d.amenityIds) ? d.amenityIds.length : 0) === 0 ? (
                                    <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                                        <AlertTitle sx={{ fontWeight: 950 }}>Chưa có tiện ích</AlertTitle>
                                        Tin này chưa chọn tiện ích nào.
                                    </Alert>
                                ) : (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {amenityLabels.map((a) => (
                                            <Chip
                                                key={a.id}
                                                label={a.label}
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 850,
                                                    borderRadius: 2,
                                                    bgcolor: "rgba(15,23,42,0.02)",
                                                    borderColor: "#e6edf7",
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </Section>

                            {/* Poster / contact */}
                            <Section title="Thông tin người đăng" icon={InfoOutlinedIcon} subtitle="Chính chủ • Liên hệ • Tác giả">
                                <Grid container spacing={1.2}>
                                    <Grid item xs={12} md={4}>
                                        <Field
                                            label="Chính chủ"
                                            value={
                                                <Chip
                                                    label={d.isOwner ? "Chính chủ" : "Không chính chủ"}
                                                    color={d.isOwner ? "success" : "warning"}
                                                    size="small"
                                                    sx={{ fontWeight: 950 }}
                                                />
                                            }
                                            icon={InfoOutlinedIcon}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <Field label="Tác giả" value={safeText(d.authorName ?? d.author?.name)} icon={ArticleOutlinedIcon} />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <Field label="Email tác giả" value={safeText(d.authorEmail ?? d.author?.email)} icon={MailOutlineIcon} />
                                    </Grid>
                                </Grid>

                                <SubBlock title="Liên hệ nhanh" icon={CallOutlinedIcon}>
                                    <Grid container spacing={1.2}>
                                        <Grid item xs={12} md={6}>
                                            <Field label="Họ và tên liên hệ" value={safeText(d.contactName)} icon={InfoOutlinedIcon} />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Box
                                                sx={{
                                                    p: 1.35,
                                                    borderRadius: 2.5,
                                                    border: "1px solid #e6edf7",
                                                    bgcolor: "#fff",
                                                    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                                                    height: "100%",
                                                }}
                                            >
                                                <Stack direction="row" spacing={1.1} alignItems="center" justifyContent="space-between">
                                                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Box
                                                            sx={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: 2,
                                                                bgcolor: "rgba(34,197,94,0.12)",
                                                                color: "#16a34a",
                                                                display: "grid",
                                                                placeItems: "center",
                                                                flex: "0 0 auto",
                                                            }}
                                                        >
                                                            <CallOutlinedIcon sx={{ fontSize: 20 }} />
                                                        </Box>

                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                                                                Số điện thoại
                                                            </Typography>
                                                            <Typography sx={{ mt: 0.4, fontSize: 15.5, fontWeight: 1000, color: "#0f172a" }}>
                                                                {safeText(d.contactPhone)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Tooltip title="Gọi nhanh">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                disabled={!d.contactPhone}
                                                                onClick={() => window.open(`tel:${d.contactPhone}`)}
                                                                sx={{ border: "1px solid #e6edf7", borderRadius: 2 }}
                                                            >
                                                                <CallOutlinedIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Stack>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Box
                                                sx={{
                                                    p: 1.35,
                                                    borderRadius: 2.5,
                                                    border: "1px solid #e6edf7",
                                                    bgcolor: "#fff",
                                                    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                                                    height: "100%",
                                                }}
                                            >
                                                <Stack direction="row" spacing={1.1} alignItems="center" justifyContent="space-between">
                                                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Box
                                                            sx={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: 2,
                                                                bgcolor: "rgba(37,99,235,0.10)",
                                                                color: "#2563eb",
                                                                display: "grid",
                                                                placeItems: "center",
                                                                flex: "0 0 auto",
                                                            }}
                                                        >
                                                            <MailOutlineIcon sx={{ fontSize: 20 }} />
                                                        </Box>

                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                                                                Email liên hệ
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    mt: 0.4,
                                                                    fontSize: 15.5,
                                                                    fontWeight: 1000,
                                                                    color: "#0f172a",
                                                                    wordBreak: "break-word",
                                                                }}
                                                            >
                                                                {safeText(d.contactEmail)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Tooltip title="Gửi email">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                disabled={!d.contactEmail}
                                                                onClick={() => window.open(`mailto:${d.contactEmail}`)}
                                                                sx={{ border: "1px solid #e6edf7", borderRadius: 2 }}
                                                            >
                                                                <MailOutlineIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Stack>
                                            </Box>
                                        </Grid>

                                        {!d.isOwner && (
                                            <Grid item xs={12}>
                                                <Field
                                                    label="Quan hệ với chủ nhà"
                                                    value={safeText(d.contactRelationship)}
                                                    icon={InfoOutlinedIcon}
                                                />
                                            </Grid>
                                        )}
                                    </Grid>
                                </SubBlock>
                            </Section>

                            {/* ===== UPDATED Decision ===== */}
                            <Section title="Quyết định duyệt" icon={CheckCircleOutlineIcon} subtitle="Thiết lập gói • Lý do (khi từ chối)">
                                <Box
                                    sx={{
                                        p: 1.6,
                                        borderRadius: 3,
                                        border: "1px solid #e6edf7",
                                        bgcolor: "rgba(2,6,23,0.02)",
                                    }}
                                >
                                    <Grid container spacing={1.6} alignItems="stretch">
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                size="small"
                                                label="Thời hạn gói (ngày)"
                                                value={decision?.durationDays ?? d.durationDays ?? ""}
                                                fullWidth
                                                onChange={(e) => {
                                                    if (!canEditDuration) return;
                                                    const v = Number(e.target.value);
                                                    setDecision({ durationDays: Number.isFinite(v) ? v : "" });
                                                }}
                                                InputProps={{ readOnly: !canEditDuration }}
                                                helperText={canEditDuration ? "Có thể chỉnh khi cần." : "Theo chính sách gói."}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" },
                                                    "& .MuiFormHelperText-root": { fontWeight: 700, color: "#64748b" },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                size="small"
                                                label="Loại tin"
                                                value={d.listingType || "NORMAL"}
                                                fullWidth
                                                InputProps={{ readOnly: true }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Box
                                                sx={{
                                                    height: "100%",
                                                    p: 1.3,
                                                    borderRadius: 2.5,
                                                    border: "1px dashed #dbe7ff",
                                                    bgcolor: "rgba(37,99,235,0.06)",
                                                    display: "flex",
                                                    gap: 1.1,
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 2,
                                                        bgcolor: "rgba(37,99,235,0.14)",
                                                        color: "#2563eb",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        flex: "0 0 auto",
                                                    }}
                                                >
                                                    <InfoOutlinedIcon sx={{ fontSize: 20 }} />
                                                </Box>

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: 12, color: "#1e3a8a", fontWeight: 950 }}>
                                                        Gợi ý cho người duyệt
                                                    </Typography>
                                                    <Typography sx={{ mt: 0.3, fontSize: 13, color: "#334155", fontWeight: 750, lineHeight: 1.5 }}>
                                                        • Bấm <b>Duyệt</b> để đăng tin theo gói hiện tại.
                                                        <br />
                                                        • Nếu <b>Từ chối</b>, hãy ghi rõ lý do để người đăng sửa và gửi lại.
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Box ref={rejectReasonBlockRef}>
                                                <TextField
                                                    inputRef={rejectReasonInputRef}
                                                    label="Lý do từ chối"
                                                    value={rejectReasonValue}
                                                    onChange={(e) => setDecision({ reason: e.target.value })}
                                                    multiline
                                                    minRows={3}
                                                    fullWidth
                                                    disabled={!isPending}
                                                    InputProps={{ readOnly: isRejected }}
                                                    placeholder={
                                                        isPending
                                                            ? "Ví dụ: Thiếu ảnh sổ hồng, địa chỉ chưa rõ, giá không hợp lý..."
                                                            : "Chỉ nhập khi tin đang Chờ duyệt"
                                                    }
                                                    helperText={isPending ? "Bắt buộc khi bấm Từ chối." : "Chỉ dùng khi tin đang Chờ duyệt."}
                                                    FormHelperTextProps={{
                                                        sx: { fontWeight: 800, color: isPending ? "#64748b" : "#94a3b8" },
                                                    }}
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2.5,
                                                            bgcolor: isPending ? "#fff" : "rgba(148,163,184,0.10)",
                                                            border: highlightReject ? "2px solid #ef4444" : "1px solid #e6edf7",
                                                            boxShadow: highlightReject ? "0 0 0 4px rgba(239,68,68,0.15)" : "none",
                                                            transition: "all 0.25s ease",
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Section>

                            {/* History */}
                            <Section title="Lịch sử" icon={HistoryOutlinedIcon} subtitle="Audit log theo thời gian">
                                <AuditTimeline items={d.audit || []} fmtDate={fmtDate} />
                            </Section>
                        </>
                    )}
                </Box>

                {/* ===== Sticky Action Bar ===== */}
                {hasDetail && (
                    <Box
                        sx={{
                            position: "sticky",
                            bottom: 0,
                            zIndex: 3,
                            px: { xs: 1.5, sm: 2 },
                            py: 1.5,
                            borderTop: "1px solid #e6edf7",
                            bgcolor: "rgba(255,255,255,0.92)",
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.2}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", sm: "center" }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    size="small"
                                    label={STATUS_LABEL[d.status] ?? d.status}
                                    color={STATUS_CHIP_COLOR?.[d.status] ?? "default"}
                                    sx={{ fontWeight: 900 }}
                                />
                                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>#{d.id}</Typography>
                            </Stack>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                                {!isXs && canOpenPublic && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<OpenInNewIcon />}
                                        onClick={() => window.open(`/real-estate/${d.id}`, "_blank")}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, borderColor: "#e6edf7" }}
                                    >
                                        Mở public
                                    </Button>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<CheckCircleOutlineIcon />}
                                    disabled={busy || !isApprovable}
                                    sx={{
                                        px: 2.4,
                                        fontWeight: 950,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        boxShadow: "0 12px 26px rgba(37,99,235,0.25)",
                                        background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                                    }}
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
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 950,
                                        borderColor: "rgba(220,38,38,0.35)",
                                    }}
                                    onClick={openRejectConfirm}
                                >
                                    Từ chối
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* ===== UPDATED ConfirmDialog behavior ===== */}
            <ConfirmDialog
                open={rejectConfirm.open}
                title="Từ chối bài đăng"
                content={
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            Bạn chắc chắn muốn từ chối tin <b>#{d.id ?? "?"}</b>?
                        </Typography>

                        {isPending && (
                            <Alert severity={rejectReasonValue.trim() ? "info" : "error"} sx={{ borderRadius: 2 }}>
                                <AlertTitle sx={{ fontWeight: 950 }}>
                                    {rejectReasonValue.trim() ? "Lưu ý" : "Thiếu lý do từ chối"}
                                </AlertTitle>
                                {rejectReasonValue.trim()
                                    ? "Hệ thống sẽ ghi nhận lý do để người đăng chỉnh sửa và gửi duyệt lại."
                                    : "Vui lòng nhập lý do từ chối trước khi xác nhận."}
                            </Alert>
                        )}
                    </Box>
                }
                confirmText={rejectReasonValue.trim() ? "Từ chối" : "Nhập lý do từ chối"}
                loading={rejectConfirm.loading}
                onClose={closeRejectConfirm}
                onConfirm={() => {
                    if (isPending && !rejectReasonValue.trim()) {
                        goToRejectReason();
                        return;
                    }
                    doReject();
                }}
            />
        </Drawer>
    );
}
