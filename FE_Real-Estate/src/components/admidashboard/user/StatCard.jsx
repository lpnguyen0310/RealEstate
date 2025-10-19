import { Card, CardContent, Typography, Box } from "@mui/material";

export default function StatCard({ title, value, img, bg = "#fff", tint = "#3059ff" }) {
    return (
        <Card sx={{ position: "relative", overflow: "hidden", flex: "1 1 260px", borderRadius: "14px", border: "1px solid #e8edf6", background: bg }}>
            <CardContent sx={{ minHeight: 110 }}>
                <Typography fontSize={13} color="#7a8aa1">{title}</Typography>
                <Typography fontSize={30} fontWeight={800} sx={{ color: "#0f2f63" }}>{value}</Typography>
                <Box sx={{ mt: 1, width: 42, height: 4, borderRadius: 999, backgroundColor: tint, opacity: 0.35 }} />
                {img && (
                    <Box component="img" src={img} alt="" sx={{ position: "absolute", right: -6, bottom: -6, width: 120, opacity: 0.22, pointerEvents: "none", userSelect: "none", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.08))" }} />
                )}
                <Box sx={{ position: "absolute", right: 70, bottom: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle at center, ${tint}22 0%, transparent 60%)` }} />
            </CardContent>
        </Card>
    );
}
