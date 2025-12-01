// src/components/admidashboard/reviews/SentimentFilterBar.jsx
import { Box, Stack, Paper, Chip, Typography } from "@mui/material";

function SentimentFilterChip({
    label,
    count,
    sentiment,
    current,
    onChange,
    color,
    subtleBg,
}) {
    const selected = current === sentiment || (!sentiment && current === "");
    return (
        <Chip
            label={
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography fontSize={12} fontWeight={600}>
                        {label}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary">
                        ({count})
                    </Typography>
                </Box>
            }
            onClick={() => onChange(sentiment || "")}
            variant={selected ? "filled" : "outlined"}
            sx={{
                borderRadius: "999px",
                fontSize: 12,
                px: 1.5,
                py: 0.25,
                bgcolor: selected ? color : subtleBg,
                color: selected ? "#ffffff" : "#0f172a",
                borderColor: selected ? color : subtleBg,
                "&:hover": {
                    bgcolor: selected ? color : "#e5e7eb",
                },
            }}
        />
    );
}

/**
 * sentimentFilter: "", "POSITIVE", "NEUTRAL", "NEGATIVE"
 * counts: { POSITIVE, NEUTRAL, NEGATIVE }
 * totalCount: tổng review (sau khi filter status BE)
 */
export default function SentimentFilterBar({
    sentimentFilter,
    onChangeSentiment,
    counts,
    totalCount,
}) {
    const safeCounts = counts || { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };

    return (
        <Box mb={2}>
            <Paper
                elevation={0}
                sx={{
                    borderRadius: "999px",
                    border: "1px solid #e2e8f0",
                    px: { xs: 1.5, md: 2 },
                    py: 1,
                    background: "linear-gradient(90deg, rgba(248,250,252,0.8), #ffffff)",
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                    >
                        Lọc nhanh theo mức độ hài lòng (trong trang hiện tại):
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <SentimentFilterChip
                            label="Tất cả"
                            count={totalCount}
                            sentiment={null}
                            current={sentimentFilter}
                            onChange={onChangeSentiment}
                            color="#0f172a"
                            subtleBg="#f3f4f6"
                        />
                        <SentimentFilterChip
                            label="Tốt (4–5★)"
                            count={safeCounts.POSITIVE}
                            sentiment="POSITIVE"
                            current={sentimentFilter}
                            onChange={onChangeSentiment}
                            color="#22c55e"
                            subtleBg="#dcfce7"
                        />
                        <SentimentFilterChip
                            label="Trung lập (3★)"
                            count={safeCounts.NEUTRAL}
                            sentiment="NEUTRAL"
                            current={sentimentFilter}
                            onChange={onChangeSentiment}
                            color="#f59e0b"
                            subtleBg="#fef3c7"
                        />
                        <SentimentFilterChip
                            label="Xấu (1–2★)"
                            count={safeCounts.NEGATIVE}
                            sentiment="NEGATIVE"
                            current={sentimentFilter}
                            onChange={onChangeSentiment}
                            color="#ef4444"
                            subtleBg="#fee2e2"
                        />
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}
