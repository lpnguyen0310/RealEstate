import { Card, CardContent, Stack, Typography, Box, LinearProgress } from "@mui/material";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

function clamp01(x) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

function KpiTile({ label, value, percent, icon, gradient, chip, bar }) {
    return (
        <Card
            elevation={0}
            sx={{
                flex: "1 1 260px",
                minWidth: 240,
                borderRadius: "16px",
                border: "1px solid #e8edf6",
                background: gradient,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <CardContent sx={{ p: 2.25 }}>
                <Box
                    sx={{
                        position: "absolute",
                        right: -14,
                        top: -14,
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        background: "#fff",
                        opacity: 0.35,
                        filter: "blur(2px)",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        right: 12,
                        top: 10,
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ffffff88",
                        color: chip,
                        boxShadow: "0 6px 16px rgba(0,0,0,.08)",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    {icon}
                </Box>

                <Typography fontSize={13} color="#64748b" sx={{ mb: 0.25 }}>
                    {label}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography fontSize={30} fontWeight={800} sx={{ color: "#0f2f63" }}>
                        {value}
                    </Typography>
                    <Typography fontSize={13} sx={{ color: chip, fontWeight: 700 }}>
                        {percent}%
                    </Typography>
                </Stack>

                <Box sx={{ mt: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: "#ffffff88",
                            "& .MuiLinearProgress-bar": { backgroundColor: bar },
                        }}
                    />
                </Box>

                <Typography fontSize={12} color="#64748b" sx={{ mt: 1 }}>
                    Tỷ lệ trên tổng tin trong hệ thống.
                </Typography>
            </CardContent>
        </Card>
    );
}

/**
 * Dùng mới: <KpiGrid counts={counts} />
 *  - counts = { PENDING_REVIEW, PUBLISHED, EXPIRING_SOON, EXPIRED, HIDDEN, REJECTED, ACTIVE? }
 *    (active = PUBLISHED; nếu BE vẫn trả ACTIVE, sẽ cộng gộp vào PUBLISHED)
 *
 * Vẫn hỗ trợ kiểu cũ (truyền total/pending/active/expSoon/expired) để không vỡ code cũ.
 */
export default function KpiGrid({
    counts,                // ✅ cách mới, khuyến nghị
    loading = false,       // (nếu cần, có thể dùng để chuyển sang indeterminate)
    // backward-compat props (tuỳ ý)
    total: totalProp = 0,
    pending: pendingProp = 0,
    active: activeProp = 0,
    expSoon: expSoonProp = 0,
    expired: expiredProp = 0,
}) {
    // Ưu tiên dùng counts nếu có
    const pending = counts ? (counts.PENDING_REVIEW || 0) : pendingProp;
    const publishedRaw = counts
        ? (counts.PUBLISHED || 0) + (counts.ACTIVE || 0) // gộp ACTIVE (nếu BE còn trả)
        : activeProp; // backward
    const expSoon = counts ? (counts.EXPIRING_SOON || 0) : expSoonProp;
    const expired = counts ? (counts.EXPIRED || 0) : expiredProp;
    const hidden = counts ? (counts.HIDDEN || 0) : 0;
    const rejected = counts ? (counts.REJECTED || 0) : 0;

    // "Đang đăng" = PUBLISHED
    const active = publishedRaw;

    // Tổng hệ thống
    const total = counts
        ? pending + active + expSoon + expired + hidden + rejected
        : totalProp;

    const pct = (n) => clamp01(total ? Math.round((n / total) * 100) : 0);

    const cards = [
        {
            key: "pending",
            label: "Chờ duyệt",
            value: pending,
            percent: pct(pending),
            icon: <PendingActionsOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff5e6 0%,#ffedd5 100%)",
            chip: "#b45309",
            bar: "#f59e0b",
        },
        {
            key: "active",
            label: "Đang hiển thị",
            value: active,
            percent: pct(active),
            icon: <RocketLaunchOutlinedIcon />,
            gradient: "linear-gradient(135deg,#eafff2 0%,#dcfce7 100%)",
            chip: "#065f46",
            bar: "#10b981",
        },
        {
            key: "expSoon",
            label: "Sắp hết hạn",
            value: expSoon,
            percent: pct(expSoon),
            icon: <ScheduleOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)",
            chip: "#9a3412",
            bar: "#fb923c",
        },
        {
            key: "expired",
            label: "Hết hạn",
            value: expired,
            percent: pct(expired),
            icon: <HighlightOffOutlinedIcon />,
            gradient: "linear-gradient(135deg,#f8fafc 0%,#e5e7eb 100%)",
            chip: "#0f172a",
            bar: "#94a3b8",
        },
    ];

    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
            {cards.map((c) => (
                <KpiTile key={c.key} {...c} />
            ))}
        </Stack>
    );
}
