import { Box, Stack, Typography, Dialog, IconButton } from "@mui/material";
import { useEffect, useMemo, useState, useCallback } from "react";

import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function ImageViewer({ images = [] }) {
    const list = useMemo(() => images.filter(Boolean), [images]);
    const safeList = list.length ? list : [null];

    const [idx, setIdx] = useState(0);

    // fullscreen viewer state
    const [open, setOpen] = useState(false);
    const openGallery = useCallback((i) => {
        if (!list.length) return;
        setIdx(i);
        setOpen(true);
    }, [list.length]);

    const closeGallery = useCallback(() => setOpen(false), []);

    const prev = useCallback(() => {
        setIdx((p) => (p - 1 + list.length) % list.length);
    }, [list.length]);

    const next = useCallback(() => {
        setIdx((p) => (p + 1) % list.length);
    }, [list.length]);

    // keyboard navigation in fullscreen
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") closeGallery();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeGallery, prev, next]);

    return (
        <Box>
            {/* ===== Main preview ===== */}
            <Box
                role="button"
                onClick={() => openGallery(idx)}
                sx={{
                    height: 360,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#f2f4f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: list.length ? "zoom-in" : "default",
                    position: "relative",
                    "&:hover .overlay": { opacity: list.length ? 1 : 0 },
                }}
            >
                {safeList[idx] ? (
                    <img
                        src={safeList[idx]}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                ) : (
                    <Typography color="text.secondary">Chưa có hình</Typography>
                )}

                {/* hover overlay */}
                <Box
                    className="overlay"
                    sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: "rgba(15,23,42,0.25)",
                        opacity: 0,
                        transition: "opacity .15s ease",
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>
                        Click để xem phóng to
                    </Typography>
                </Box>
            </Box>

            {/* ===== Thumbnails ===== */}
            {list.length > 1 && (
                <Stack direction="row" spacing={1} mt={1} sx={{ overflowX: "auto", pb: 1 }}>
                    {list.map((src, i) => (
                        <img
                            key={src + i}
                            src={src}
                            alt=""
                            onClick={() => setIdx(i)}
                            style={{
                                width: 90,
                                height: 70,
                                objectFit: "cover",
                                borderRadius: 8,
                                cursor: "pointer",
                                border: i === idx ? "2px solid #3059ff" : "1px solid #e5e7eb",
                            }}
                        />
                    ))}
                </Stack>
            )}

            {/* ===== Fullscreen gallery ===== */}
            <Dialog open={open} onClose={closeGallery} fullScreen>
                <Box sx={{ bgcolor: "#000", height: "100vh", position: "relative" }}>
                    {/* top bar */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 2,
                            px: 2,
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            color: "#fff",
                            bgcolor: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(6px)",
                        }}
                    >
                        <Typography sx={{ fontWeight: 900 }}>
                            {list.length ? `${idx + 1} / ${list.length}` : ""}
                        </Typography>

                        <IconButton onClick={closeGallery} sx={{ color: "#fff" }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* image */}
                    {list[idx] && (
                        <Box
                            component="img"
                            src={list[idx]}
                            alt=""
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: "block",
                                pt: "52px", // tránh bị top bar che
                            }}
                        />
                    )}

                    {/* arrows */}
                    {list.length > 1 && (
                        <>
                            <IconButton
                                onClick={prev}
                                sx={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#fff",
                                    bgcolor: "rgba(255,255,255,0.12)",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.20)" },
                                }}
                            >
                                <ArrowBackIosNewIcon />
                            </IconButton>

                            <IconButton
                                onClick={next}
                                sx={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#fff",
                                    bgcolor: "rgba(255,255,255,0.12)",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.20)" },
                                }}
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>
                        </>
                    )}

                    {/* bottom thumbnails */}
                    {list.length > 1 && (
                        <Box
                            sx={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 2,
                                px: 2,
                                py: 1.25,
                                bgcolor: "rgba(0,0,0,0.35)",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <Stack direction="row" spacing={1} sx={{ overflowX: "auto" }}>
                                {list.map((src, i) => (
                                    <Box
                                        key={src + i}
                                        component="img"
                                        src={src}
                                        onClick={() => setIdx(i)}
                                        sx={{
                                            width: 86,
                                            height: 64,
                                            borderRadius: 1.5,
                                            objectFit: "cover",
                                            cursor: "pointer",
                                            border: i === idx ? "2px solid #60a5fa" : "1px solid rgba(255,255,255,0.25)",
                                            opacity: i === idx ? 1 : 0.75,
                                            "&:hover": { opacity: 1 },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Dialog>
        </Box>
    );
}
