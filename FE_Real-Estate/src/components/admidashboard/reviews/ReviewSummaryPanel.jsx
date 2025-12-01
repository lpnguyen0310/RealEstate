// src/components/admidashboard/reviews/ReviewSummaryPanel.jsx
import { Box, Paper, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";

export default function ReviewSummaryPanel({
    avgRating,
    totalReviews,
    ratingStats = [],
}) {
    const safeAvg = Number.isFinite(avgRating) ? avgRating : 0;

    // Tính số lượng đánh giá xấu: 1★ + 2★
    const badCount = (ratingStats || []).reduce((sum, item) => {
        if (item.star <= 2) return sum + (item.count || 0);
        return sum;
    }, 0);

    return (
        <Box mb={3}>
            <Paper
                elevation={0}
                sx={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    background: "linear-gradient(to right, #ffffff, #f8fafc)",
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 2.5 },
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                >
                    {/* Left: avg rating + cảnh báo xấu */}
                    <Box display="flex" gap={2} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "12px",
                                bgcolor: "#fff7ed",
                                color: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <StarIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{
                                    textTransform: "uppercase",
                                    fontSize: 11,
                                    letterSpacing: 0.6,
                                    fontWeight: 600,
                                }}
                            >
                                Điểm trung bình (Trang hiện tại)
                            </Typography>
                            <Box display="flex" alignItems="baseline" gap={1}>
                                <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    color="#1e293b"
                                    sx={{ mt: 0.5 }}
                                >
                                    {safeAvg.toFixed(1)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    / 5.0
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Dựa trên {totalReviews} đánh giá trong trang hiện tại
                                (đã áp dụng bộ lọc)
                            </Typography>

                            {/* Cảnh báo khi có đánh giá xấu */}
                            <Box mt={1.25}>
                                {badCount > 0 ? (
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.75,
                                            px: 1.25,
                                            py: 0.5,
                                            borderRadius: "999px",
                                            bgcolor: "#fef2f2",
                                            border: "1px solid #fecaca",
                                        }}
                                    >
                                        <ReportProblemOutlinedIcon
                                            sx={{ fontSize: 18, color: "#ef4444" }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "#b91c1c", fontWeight: 500 }}
                                        >
                                            Có {badCount} đánh giá xấu (1–2★) cần xem xét
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "#16a34a", fontWeight: 500 }}
                                    >
                                        Không có đánh giá xấu (1–2★) trong trang hiện tại.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right: phân bố số sao */}
                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent={{ xs: "flex-start", md: "flex-end" }}
                    >
                        {ratingStats.map(({ star, count }) => (
                            <Box
                                key={star}
                                sx={{
                                    minWidth: 80,
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: "8px",
                                    bgcolor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "translateY(-2px)",
                                        borderColor: "#cbd5e1",
                                    },
                                }}
                            >
                                <Typography fontSize={12} fontWeight={600} color="#64748b">
                                    {star} <span style={{ color: "#fbbf24" }}>★</span>
                                </Typography>
                                <Typography fontSize={14} fontWeight={700} color="#334155">
                                    {count}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}
