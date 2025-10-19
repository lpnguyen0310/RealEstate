import { Card, CardContent, Stack, Typography, Box, LinearProgress } from "@mui/material";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

function KpiTile({ label, value, percent, icon, gradient, chip, bar }) {
    return (
        <Card elevation={0} sx={{
            flex: "1 1 260px", minWidth: 240, borderRadius: "16px",
            border: "1px solid #e8edf6", background: gradient, position: "relative", overflow: "hidden"
        }}>
            <CardContent sx={{ p: 2.25 }}>
                <Box sx={{ position: "absolute", right: -14, top: -14, width: 90, height: 90, borderRadius: "50%", background: "#fff", opacity: 0.35, filter: "blur(2px)" }} />
                <Box sx={{
                    position: "absolute", right: 12, top: 10, width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center",
                    bgcolor: "#ffffff88", color: chip, boxShadow: "0 6px 16px rgba(0,0,0,.08)", backdropFilter: "blur(3px)"
                }}>
                    {icon}
                </Box>

                <Typography fontSize={13} color="#64748b" sx={{ mb: .25 }}>{label}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography fontSize={30} fontWeight={800} sx={{ color: "#0f2f63" }}>{value}</Typography>
                    <Typography fontSize={13} sx={{ color: chip, fontWeight: 700 }}>{percent}%</Typography>
                </Stack>

                <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={percent}
                        sx={{ height: 8, borderRadius: 999, backgroundColor: "#ffffff88", "& .MuiLinearProgress-bar": { backgroundColor: bar } }} />
                </Box>

                <Typography fontSize={12} color="#64748b" sx={{ mt: 1 }}>
                    Tỷ lệ trên tổng tin trong hệ thống.
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function KpiGrid({ total = 0, pending = 0, active = 0, expSoon = 0, expired = 0 }) {
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    const cards = [
        {
            key: "pending", label: "Chờ duyệt", value: pending, percent: pct(pending), icon: <PendingActionsOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff5e6 0%,#ffedd5 100%)", chip: "#b45309", bar: "#f59e0b"
        },
        {
            key: "active", label: "Đang đăng", value: active, percent: pct(active), icon: <RocketLaunchOutlinedIcon />,
            gradient: "linear-gradient(135deg,#eafff2 0%,#dcfce7 100%)", chip: "#065f46", bar: "#10b981"
        },
        {
            key: "expSoon", label: "Sắp hết hạn", value: expSoon, percent: pct(expSoon), icon: <ScheduleOutlinedIcon />,
            gradient: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)", chip: "#9a3412", bar: "#fb923c"
        },
        {
            key: "expired", label: "Hết hạn", value: expired, percent: pct(expired), icon: <HighlightOffOutlinedIcon />,
            gradient: "linear-gradient(135deg,#f8fafc 0%,#e5e7eb 100%)", chip: "#0f172a", bar: "#94a3b8"
        },
    ];

    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mb={2}>
            {cards.map((c) => <KpiTile key={c.key} {...c} />)}
        </Stack>
    );
}
