import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";

export default function ImageViewer({ images = [] }) {
    const list = images.length ? images : [null];
    const [idx, setIdx] = useState(0);

    return (
        <Box>
            <Box sx={{
                height: 360, borderRadius: 2, overflow: "hidden", bgcolor: "#f2f4f8",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {list[idx]
                    ? <img src={list[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Typography color="text.secondary">Chưa có hình</Typography>
                }
            </Box>

            {images.length > 1 && (
                <Stack direction="row" spacing={1} mt={1} sx={{ overflowX: "auto", pb: 1 }}>
                    {images.map((src, i) => (
                        <img key={src} src={src} alt="" onClick={() => setIdx(i)}
                            style={{
                                width: 90, height: 70, objectFit: "cover", borderRadius: 8, cursor: "pointer",
                                border: i === idx ? "2px solid #3059ff" : "1px solid #e5e7eb",
                            }} />
                    ))}
                </Stack>
            )}
        </Box>
    );
}
