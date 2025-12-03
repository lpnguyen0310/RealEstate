import { Box, Typography, Paper } from "@mui/material";

export default function StatCard({ title, value, icon: Icon, color, subText }) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: "16px",
                p: 2.5,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 2,
                transition: "all 0.25s ease",
                "&:hover": {
                    boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
                    transform: "translateY(-2px)"
                }
            }}
        >
            {/* ICON */}
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    bgcolor: `${color}20`, // opacity 12%
                    color: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon size={26} />
            </Box>

            {/* TEXT */}
            <Box>
                <Typography fontSize={14} fontWeight={600} color="text.secondary">
                    {title}
                </Typography>
                <Typography fontSize={26} fontWeight={800} color="#111827">
                    {value}
                </Typography>
                {subText && (
                    <Typography fontSize={13} color="text.secondary">
                        {subText}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
