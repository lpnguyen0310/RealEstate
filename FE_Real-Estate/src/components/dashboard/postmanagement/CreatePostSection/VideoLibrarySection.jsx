import { Box, Card, CardContent, Divider, Typography, TextField } from "@mui/material";

const isYouTube = (url) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/i.test(url);
const isTikTok = (url) =>
    /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/i.test(url);
const isValidVideoUrl = (url) => !url || isYouTube(url) || isTikTok(url);

export default function VideoLibrarySection({ videoUrls = ["", ""], onChange }) {
    const setAt = (idx, val) => {
        const next = [...(videoUrls || [])];
        next[idx] = val;
        onChange?.(next);
    };

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
                borderColor: "#e1e5ee",
                boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}
        >
            <CardContent sx={{ p: 1.5 }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}
                >
                    Thư viện video
                </Typography>
                <Divider sx={{ borderColor: "#0f223a", mt: 1, mb: 1.2 }} />

                <Box display="flex" flexDirection="column" gap={0}>
                    {[0, 1].map((i) => {
                        const val = videoUrls?.[i] ?? "";
                        const valid = isValidVideoUrl(val);
                        return (
                            <TextField
                                key={i}
                                label="URL"
                                size="small"
                                fullWidth
                                value={val}
                                onChange={(e) => setAt(i, e.target.value.trim())}
                                error={!!val && !valid}
                                helperText={
                                    !!val && !valid ? "Chỉ hỗ trợ link TikTok/YouTube hợp lệ" : " "
                                }
                                InputProps={{
                                    sx: {
                                        borderRadius: "10px",
                                        height: 40,
                                        "& fieldset": { borderColor: "#e1e5ee" },
                                        "&:hover fieldset": { borderColor: "#c7cfe0" },
                                        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                                    },
                                }}
                            />
                        );
                    })}
                </Box>

                <Typography sx={{ color: "#64748b", fontSize: 13, mt: 0.5 }}>
                    Chỉ hỗ trợ link video từ TikTok và YouTube
                </Typography>
            </CardContent>
        </Card>
    );
}
