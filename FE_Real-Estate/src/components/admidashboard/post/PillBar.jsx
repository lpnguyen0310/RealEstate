import { Box, Stack, Typography } from "@mui/material";

export default function PillBar({ selected, onSelect, counts }) {
    const pills = [
        { key: "PUBLISHED", label: "Đang Đăng", badgeBg: "#e6edf9" },
        { key: "PENDING", label: "Chờ Duyệt", badgeBg: "#fde68a" },
        { key: "REJECTED", label: "Bị Từ Chối", badgeBg: "#fecdd3" },
        { key: "EXPIRED", label: "Hết Hạn", badgeBg: "#cbd5e1" },
        { key: "EXPIRING_SOON", label: "Sắp Hết Hạn", badgeBg: "#fed7aa" },
        { key: "HIDDEN", label: "Đã Ẩn", badgeBg: "#cbd5e1" },
    ];

    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {pills.map((p) => {
                const active = selected === p.key;
                return (
                    <Box
                        key={p.key}
                        onClick={() => onSelect(p.key)}
                        sx={{
                            userSelect: "none", cursor: "pointer", px: 2.25, py: 1, borderRadius: "16px",
                            border: "1px solid #e5e7eb", bgcolor: active ? "#0f2350" : "#fff",
                            color: active ? "#fff" : "#111827", display: "inline-flex", alignItems: "center", gap: 1.25,
                            boxShadow: active ? "0 2px 6px rgba(15,35,80,.25)" : "none",
                        }}
                    >
                        <Typography fontWeight={800}>{p.label}</Typography>
                        <Box sx={{
                            ml: .25, fontSize: 12, fontWeight: 800, px: 1, lineHeight: "18px", height: 18, borderRadius: "8px",
                            color: "#0f2350", bgcolor: p.badgeBg || "#eef2f7", ...(active && { bgcolor: "#e6edf9" }),
                        }}>
                            {counts[p.key] || 0}
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
}
