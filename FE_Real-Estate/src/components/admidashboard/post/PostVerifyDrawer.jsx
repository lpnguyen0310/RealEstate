// src/components/.../post/PostVerifyDrawer.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
    Drawer,
    Box,
    Stack,
    Typography,
    IconButton,
    Chip,
    Card,
    CardContent,
    Alert,
    AlertTitle,
    Divider,
    Tabs,
    Tab,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ImageViewer from "./ImageViewer";
import FileList from "./FileList";

/* ================= helpers ================= */
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const normalize = (v) => toArray(v).filter(Boolean);

const isImage = (mime = "", url = "") =>
    (mime || "").toLowerCase().startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(url || "");

function normalizeFileItem(x) {
    if (!x) return null;
    if (typeof x === "string") return { url: x, mimeType: "", name: "" };

    return {
        url: x.url || x.imageUrl || x.fileUrl || "",
        mimeType: x.mimeType || x.type || "",
        name: x.name || x.originalName || "",
    };
}

/**
 * Ưu tiên các field bạn đang map từ slice:
 * - deedFiles
 * - authorizationFiles
 * Fallback thêm vài field khác cho chắc.
 */
function extractFiles(detail) {
    if (!detail) return { deedImages: [], deedDocs: [], authImages: [], authDocs: [] };

    const deedRaw = normalize(
        detail.deedFiles ??
        detail.deedFileUrls ??
        detail.redBookImages ??
        detail.soDoImages ??
        detail.redBookUrls ??
        detail.soDoUrls ??
        detail.redBookUrl ??
        detail.soDoUrl
    );

    const authRaw = normalize(
        detail.authorizationFiles ??
        detail.authorizationFileUrls ??
        detail.authorizationImages ??
        detail.giayUyQuyenImages ??
        detail.powerOfAttorneyImages ??
        detail.authorizationUrls ??
        detail.uyQuyenUrls ??
        detail.powerOfAttorneyUrls ??
        detail.authorizationUrl ??
        detail.uyQuyenUrl ??
        detail.powerOfAttorneyUrl
    );

    const deedNorm = deedRaw.map(normalizeFileItem).filter((x) => x?.url);
    const authNorm = authRaw.map(normalizeFileItem).filter((x) => x?.url);

    const deedImages = deedNorm.filter((f) => isImage(f.mimeType, f.url));
    const deedDocs = deedNorm.filter((f) => !isImage(f.mimeType, f.url));

    const authImages = authNorm.filter((f) => isImage(f.mimeType, f.url));
    const authDocs = authNorm.filter((f) => !isImage(f.mimeType, f.url));

    return { deedImages, deedDocs, authImages, authDocs };
}

function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return <Box sx={{ pt: 2 }}>{children}</Box>;
}

/* ================= component ================= */
export default function PostVerifyDrawer({ open, onClose, detail, isXs, mainDrawerWidth }) {
    /* ===== owner rule (ONLY THIS) ===== */
    // ❗ Chỉ khi isOwner === false mới là không chính chủ
    const isOwner = detail?.isOwner !== false;

    /* ===== files/images ===== */
    const { deedImages, deedDocs, authImages, authDocs } = useMemo(() => extractFiles(detail), [detail]);

    /* ===== tabs ===== */
    const tabs = useMemo(() => {
        const base = [
            {
                key: "deed",
                label: "Giấy tờ sở hữu",
                count: deedImages.length + deedDocs.length,
            },
        ];
        if (!isOwner) {
            base.push({
                key: "auth",
                label: "Giấy ủy quyền",
                count: authImages.length + authDocs.length,
            });
        }
        return base;
    }, [deedImages.length, deedDocs.length, authImages.length, authDocs.length, isOwner]);

    const [tab, setTab] = useState(0);

    // reset tab khi đổi tin hoặc đổi trạng thái chính chủ
    useEffect(() => {
        setTab(0);
    }, [detail?.id, isOwner]);

    // đảm bảo tab hợp lệ
    useEffect(() => {
        if (tab > tabs.length - 1) setTab(0);
    }, [tab, tabs.length]);

    /* ===== layout ===== */
    const width = isXs ? "100vw" : 420;
    const rightOffset = isXs ? 0 : `calc(${mainDrawerWidth}px + 12px)`;

    const hasDeed = deedImages.length + deedDocs.length > 0;
    const hasAuth = authImages.length + authDocs.length > 0;
    const hasAnyDocs = hasDeed || (!isOwner && hasAuth);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant={isXs ? "temporary" : "persistent"}
            hideBackdrop={!isXs}
            PaperProps={{
                sx: {
                    width,
                    right: rightOffset,
                    position: "fixed",
                    bgcolor: "#fff",
                    border: "1px solid #e6edf7",
                    boxShadow: "0 16px 50px rgba(0,0,0,0.18)",
                    ...(isXs
                        ? { height: "100vh", borderRadius: 0 }
                        : { height: "calc(100vh - 48px)", mt: 3, mb: 3, mr: 3, borderRadius: 3 }),
                },
            }}
        >
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {/* ===== Header ===== */}
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid #e6edf7",
                        position: "sticky",
                        top: 0,
                        bgcolor: "#fff",
                        zIndex: 2,
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 2,
                                    bgcolor: "rgba(37,99,235,0.10)",
                                    color: "#2563eb",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <GavelOutlinedIcon />
                            </Box>

                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography sx={{ fontWeight: 950 }}>Giấy tờ pháp lý</Typography>

                                    <Chip
                                        label={isOwner ? "Chính chủ" : "Không chính chủ"}
                                        color={isOwner ? "success" : "warning"}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 900 }}
                                    />
                                </Stack>

                                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                    Tin #{detail?.id ?? "-"}
                                </Typography>
                            </Box>
                        </Stack>

                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* ===== Tabs ===== */}
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            mt: 1.2,
                            minHeight: 38,
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 950,
                                minHeight: 38,
                                px: 1.5,
                                borderRadius: 2,
                            },
                            "& .Mui-selected": {
                                color: "#2563eb",
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: 3,
                                backgroundColor: "#2563eb",
                            },
                        }}
                    >
                        {tabs.map((t) => (
                            <Tab
                                key={t.key}
                                label={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>{t.label}</span>
                                        <Chip
                                            size="small"
                                            label={t.count}
                                            sx={{
                                                height: 20,
                                                fontWeight: 900,
                                                bgcolor: "rgba(15,23,42,0.04)",
                                                border: "1px solid #e6edf7",
                                            }}
                                        />
                                    </Stack>
                                }
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* ===== Content ===== */}
                <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
                    {!hasAnyDocs ? (
                        <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                            <AlertTitle sx={{ fontWeight: 950 }}>Chưa có giấy tờ</AlertTitle>
                            Tin này chưa upload ảnh/file giấy tờ sở hữu{!isOwner ? " / giấy ủy quyền" : ""}.
                        </Alert>
                    ) : (
                        <>
                            {/* ===== Giấy tờ sở hữu ===== */}
                            <TabPanel value={tab} index={0}>
                                {!hasDeed ? (
                                    <Alert severity="info">
                                        <AlertTitle>Chưa có giấy tờ sở hữu</AlertTitle>
                                        Tin này chưa upload ảnh/file giấy tờ sở hữu.
                                    </Alert>
                                ) : (
                                    <Stack spacing={1.2}>
                                        {deedImages.length > 0 && (
                                            <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
                                                <CardContent>
                                                    <ImageViewer images={deedImages.map((f) => f.url)} />
                                                </CardContent>
                                            </Card>
                                        )}

                                        {deedDocs.length > 0 && <FileList files={deedDocs} />}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* ===== Giấy ủy quyền – chỉ khi KHÔNG chính chủ ===== */}
                            {!isOwner && (
                                <TabPanel value={tab} index={1}>
                                    {!hasAuth ? (
                                        <Alert severity="warning">
                                            <AlertTitle>Thiếu giấy ủy quyền</AlertTitle>
                                            Tin này không chính chủ nhưng chưa upload ảnh/file giấy ủy quyền.
                                        </Alert>
                                    ) : (
                                        <Stack spacing={1.2}>
                                            {authImages.length > 0 && (
                                                <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
                                                    <CardContent>
                                                        <ImageViewer images={authImages.map((f) => f.url)} />
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {authDocs.length > 0 && <FileList files={authDocs} />}
                                        </Stack>
                                    )}
                                </TabPanel>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                                <AlertTitle sx={{ fontWeight: 950 }}>Checklist nhanh</AlertTitle>
                                Kiểm tra chủ sở hữu, địa chỉ, diện tích; ảnh/file rõ nét;
                                {!isOwner && " và giấy ủy quyền hợp lệ."}
                            </Alert>
                        </>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
}
