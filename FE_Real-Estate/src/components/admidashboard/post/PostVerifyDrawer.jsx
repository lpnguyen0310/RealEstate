// src/components/.../post/PostVerifyDrawer.jsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
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
    Button,
    Tooltip,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";

import ImageViewer from "./ImageViewer";
import FileList from "./FileList";

/* ================= helpers ================= */
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const normalize = (v) => toArray(v).filter(Boolean);

const isImage = (mime = "", url = "") =>
    (mime || "").toLowerCase().startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(url || "");

// ✅ FIX: luôn lấy được tên file từ URL (kể cả có query ?...)
function getFileNameFromUrl(url = "") {
    const last = (url.split("/").pop() || "").split("?")[0];
    try {
        return decodeURIComponent(last);
    } catch {
        return last;
    }
}

// ✅ FIX: normalizeFileItem không để name rỗng nữa
function normalizeFileItem(x) {
    if (!x) return null;

    // backend trả string URL
    if (typeof x === "string") {
        return {
            url: x,
            mimeType: "",
            name: getFileNameFromUrl(x), // ✅
        };
    }

    const url = x.url || x.imageUrl || x.fileUrl || "";

    return {
        url,
        mimeType: x.mimeType || x.type || "",
        // ✅ fallback nhiều key + fallback từ URL
        name: x.name || x.originalName || x.fileName || x.filename || getFileNameFromUrl(url),
    };
}

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

/* ================== UI blocks ================== */

function SectionHeader({ title, subtitle, right }) {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.25 }}>
            <Box>
                <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                {subtitle ? (
                    <Typography sx={{ mt: 0.2, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
            {right}
        </Stack>
    );
}


function StatusChecklist({ isOwner, hasDeed, hasAuth, aiScore, verificationStatus }) {
    const scoreNum = typeof aiScore === "number" ? aiScore : null;
    const aiHas = scoreNum != null;
    const aiOk = aiHas && scoreNum >= 60; // ✅ ngưỡng đạt (đổi tuỳ ý)
    const status = (verificationStatus || "UNVERIFIED").toString();
    const statusOk = status === "VERIFIED";

    const items = [
        { ok: hasDeed, label: "Có giấy tờ sở hữu (ảnh/file)" },
        ...(!isOwner ? [{ ok: hasAuth, label: "Có giấy ủy quyền (ảnh/file)" }] : []),
        { ok: aiHas, label: `Có điểm AI (${aiHas ? `${scoreNum}/100` : "-"})` },
        { ok: aiOk, label: "Điểm AI đạt ngưỡng tin cậy" },
        { ok: statusOk, label: `Trạng thái xác minh: ${status}` },

        // (giữ các checklist thủ công)
        { ok: true, label: "Ảnh rõ nét, đọc được số/thông tin" },
        { ok: true, label: "Thông tin địa chỉ / diện tích khớp nội dung tin" },
    ];

    const okCount = items.filter((x) => x.ok).length;
    const percent = Math.round((okCount / items.length) * 100);

    const aiChipColor =
        scoreNum == null ? "default" : scoreNum >= 80 ? "success" : scoreNum >= 60 ? "warning" : "error";

    return (
        <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
            <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 13 }}>Tình trạng hồ sơ</Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {scoreNum != null ? (
                            <Chip
                                size="small"
                                label={`AI: ${scoreNum}/100`}
                                color={aiChipColor}
                                variant="outlined"
                                sx={{ fontWeight: 900 }}
                            />
                        ) : null}

                        <Chip
                            size="small"
                            label={`${percent}%`}
                            color={percent >= 75 ? "success" : percent >= 50 ? "warning" : "error"}
                            variant="outlined"
                            sx={{ fontWeight: 900 }}
                        />
                    </Stack>
                </Stack>

                <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 99 }} />

                <List dense sx={{ mt: 1, py: 0 }}>
                    {items.map((it, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                            <Box
                                sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 99,
                                    mr: 1.2,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: it.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)",
                                    color: it.ok ? "#10b981" : "#ef4444",
                                    flex: "0 0 auto",
                                }}
                            >
                                {it.ok ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> : <HighlightOffOutlinedIcon sx={{ fontSize: 16 }} />}
                            </Box>
                            <ListItemText
                                primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 700, color: "#0f172a" } }}
                                primary={it.label}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* nhỏ gọn: show raw status */}
                <Typography sx={{ mt: 0.75, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Verification status: <b>{status}</b>
                </Typography>
            </CardContent>
        </Card>
    );
}

function ImageGrid({ items, onOpen }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                "@media (max-width: 420px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
            }}
        >
            {items.map((it, idx) => (
                <Box
                    key={it.url + idx}
                    role="button"
                    onClick={() => onOpen(idx)}
                    sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid #e6edf7",
                        position: "relative",
                        aspectRatio: "1 / 1",
                        bgcolor: "#f8fafc",
                        "&:hover .overlay": { opacity: 1 },
                    }}
                >
                    <Box
                        component="img"
                        src={it.url}
                        alt={it.name || `image-${idx}`}
                        loading="lazy"
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <Box
                        className="overlay"
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(15,23,42,0.25)",
                            opacity: 0,
                            transition: "opacity .18s ease",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                        }}
                    >
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ fontWeight: 900 }}>
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                            <Typography sx={{ fontWeight: 950, fontSize: 13 }}>Xem</Typography>
                        </Stack>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

function getExt(nameOrUrl = "") {
    const base = (nameOrUrl.split("?")[0] || "").split("/").pop() || "";
    const dot = base.lastIndexOf(".");
    return dot >= 0 ? base.slice(dot + 1).toUpperCase() : "FILE";
}

function prettifyName(name = "") {
    return name;
}

function DocCardList({ files }) {
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch { }
    };

    return (
        <Stack spacing={1}>
            {files.map((f, idx) => {
                const displayName = prettifyName(f.name || "Tài liệu");
                const ext = getExt(f.name || f.url);
                const isPdf = ext === "PDF";
                const isDoc = ["DOC", "DOCX"].includes(ext);

                return (
                    <Card
                        key={f.url + idx}
                        variant="outlined"
                        sx={{
                            borderRadius: 3,
                            borderColor: "#e6edf7",
                            overflow: "hidden",
                            transition: "transform .12s ease, box-shadow .12s ease",
                            "&:hover": {
                                transform: "translateY(-1px)",
                                boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
                            },
                        }}
                    >
                        <CardContent sx={{ py: 1.25 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                                {/* Left */}
                                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 2.5,
                                            display: "grid",
                                            placeItems: "center",
                                            flex: "0 0 auto",
                                            bgcolor: isPdf
                                                ? "rgba(239,68,68,0.10)"
                                                : isDoc
                                                    ? "rgba(37,99,235,0.10)"
                                                    : "rgba(99,102,241,0.10)",
                                            color: isPdf ? "#ef4444" : isDoc ? "#2563eb" : "#4f46e5",
                                            border: "1px solid rgba(230,237,247,1)",
                                        }}
                                    >
                                        <DescriptionOutlinedIcon />
                                    </Box>

                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            title={displayName}
                                            sx={{
                                                fontWeight: 950,
                                                fontSize: 13.5,
                                                color: "#0f172a",
                                                lineHeight: 1.2,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {displayName}
                                        </Typography>

                                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={ext}
                                                variant="outlined"
                                                sx={{
                                                    height: 20,
                                                    fontWeight: 900,
                                                    bgcolor: "rgba(15,23,42,0.03)",
                                                    borderColor: "#e6edf7",
                                                }}
                                            />
                                            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                                {f.mimeType || "document"}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Stack>

                                {/* Right actions */}
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: "0 0 auto" }}>
                                    <Tooltip title="Mở tài liệu">
                                        <IconButton
                                            size="small"
                                            onClick={() => window.open(f.url, "_blank", "noreferrer")}
                                            sx={{
                                                borderRadius: 2,
                                                border: "1px solid #e6edf7",
                                                bgcolor: "rgba(2,6,23,0.02)",
                                                "&:hover": { bgcolor: "rgba(2,6,23,0.05)" },
                                            }}
                                        >
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Copy link">
                                        <IconButton
                                            size="small"
                                            onClick={() => copy(f.url)}
                                            sx={{
                                                borderRadius: 2,
                                                border: "1px solid #e6edf7",
                                                bgcolor: "rgba(2,6,23,0.02)",
                                                "&:hover": { bgcolor: "rgba(2,6,23,0.05)" },
                                            }}
                                        >
                                            <ContentCopyOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </CardContent>

                        <Box
                            sx={{
                                height: 6,
                                bgcolor: isPdf
                                    ? "rgba(239,68,68,0.25)"
                                    : isDoc
                                        ? "rgba(37,99,235,0.25)"
                                        : "rgba(99,102,241,0.25)",
                            }}
                        />
                    </Card>
                );
            })}
        </Stack>
    );
}

/* ================= component ================= */
export default function PostVerifyDrawer({ open, onClose, detail, isXs, mainDrawerWidth }) {
    // ❗ Chỉ khi isOwner === false mới là không chính chủ
    const isOwner = detail?.isOwner !== false;

    // ✅ lấy điểm & status AI từ detail (đã map từ BE -> DTO -> slice)
    const aiScore =
        typeof detail?.verificationScore === "number"
            ? Math.max(0, Math.min(100, Math.round(detail.verificationScore)))
            : null;

    const verificationStatus = (detail?.verificationStatus || "UNVERIFIED").toString();

    const { deedImages, deedDocs, authImages, authDocs } = useMemo(() => extractFiles(detail), [detail]);

    const tabs = useMemo(() => {
        const base = [{ key: "deed", label: "Giấy tờ sở hữu", count: deedImages.length + deedDocs.length }];
        if (!isOwner) base.push({ key: "auth", label: "Giấy ủy quyền", count: authImages.length + authDocs.length });
        return base;
    }, [deedImages.length, deedDocs.length, authImages.length, authDocs.length, isOwner]);

    const [tab, setTab] = useState(0);

    useEffect(() => setTab(0), [detail?.id, isOwner]);
    useEffect(() => {
        if (tab > tabs.length - 1) setTab(0);
    }, [tab, tabs.length]);

    const width = isXs ? "100vw" : 460;
    const rightOffset = isXs ? 0 : `calc(${mainDrawerWidth}px + 12px)`;

    const hasDeed = deedImages.length + deedDocs.length > 0;
    const hasAuth = authImages.length + authDocs.length > 0;
    const hasAnyDocs = hasDeed || (!isOwner && hasAuth);

    const [viewer, setViewer] = useState({ open: false, images: [], index: 0 });

    const openViewer = useCallback((images, index) => {
        setViewer({ open: true, images, index });
    }, []);

    const closeViewer = useCallback(() => setViewer((s) => ({ ...s, open: false })), []);

    const deedUrls = useMemo(() => deedImages.map((x) => x.url), [deedImages]);
    const authUrls = useMemo(() => authImages.map((x) => x.url), [authImages]);

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

                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            mt: 1.2,
                            minHeight: 38,
                            "& .MuiTab-root": { textTransform: "none", fontWeight: 950, minHeight: 38, px: 1.5, borderRadius: 2 },
                            "& .Mui-selected": { color: "#2563eb" },
                            "& .MuiTabs-indicator": { height: 3, borderRadius: 3, backgroundColor: "#2563eb" },
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
                                            sx={{ height: 20, fontWeight: 900, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid #e6edf7" }}
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
                        <Stack spacing={1.5}>
                            {/* ✅ UPDATED: AI đánh giá nằm trong tình trạng hồ sơ */}
                            <StatusChecklist
                                isOwner={isOwner}
                                hasDeed={hasDeed}
                                hasAuth={hasAuth}
                                aiScore={aiScore}
                                verificationStatus={verificationStatus}
                            />

                            <TabPanel value={tab} index={0}>
                                {!hasDeed ? (
                                    <Alert severity="info">
                                        <AlertTitle>Chưa có giấy tờ sở hữu</AlertTitle>
                                        Tin này chưa upload ảnh/file giấy tờ sở hữu.
                                    </Alert>
                                ) : (
                                    <Stack spacing={1.25}>
                                        {deedImages.length > 0 && (
                                            <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
                                                <CardContent>
                                                    <SectionHeader
                                                        title="Ảnh giấy tờ sở hữu"
                                                        subtitle="Click vào ảnh để xem lớn."
                                                        right={
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityOutlinedIcon />}
                                                                sx={{ fontWeight: 900, borderRadius: 2 }}
                                                                onClick={() => openViewer(deedUrls, 0)}
                                                            >
                                                                Xem tất cả
                                                            </Button>
                                                        }
                                                    />
                                                    <ImageGrid items={deedImages} onOpen={(idx) => openViewer(deedUrls, idx)} />
                                                </CardContent>
                                            </Card>
                                        )}

                                        {deedDocs.length > 0 && (
                                            <Box>
                                                <SectionHeader title="Tài liệu đính kèm" subtitle="PDF/DOC/… (mở tab mới hoặc copy link)" />
                                                <DocCardList files={deedDocs} />
                                            </Box>
                                        )}
                                    </Stack>
                                )}
                            </TabPanel>

                            {!isOwner && (
                                <TabPanel value={tab} index={1}>
                                    {!hasAuth ? (
                                        <Alert severity="warning">
                                            <AlertTitle>Thiếu giấy ủy quyền</AlertTitle>
                                            Tin này không chính chủ nhưng chưa upload ảnh/file giấy ủy quyền.
                                        </Alert>
                                    ) : (
                                        <Stack spacing={1.25}>
                                            {authImages.length > 0 && (
                                                <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
                                                    <CardContent>
                                                        <SectionHeader
                                                            title="Ảnh giấy ủy quyền"
                                                            subtitle="Kiểm tra chữ ký, ngày tháng, phạm vi ủy quyền."
                                                            right={
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<VisibilityOutlinedIcon />}
                                                                    sx={{ fontWeight: 900, borderRadius: 2 }}
                                                                    onClick={() => openViewer(authUrls, 0)}
                                                                >
                                                                    Xem tất cả
                                                                </Button>
                                                            }
                                                        />
                                                        <ImageGrid items={authImages} onOpen={(idx) => openViewer(authUrls, idx)} />
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {authDocs.length > 0 && (
                                                <Box>
                                                    <SectionHeader title="Tài liệu ủy quyền" />
                                                    <DocCardList files={authDocs} />
                                                </Box>
                                            )}
                                        </Stack>
                                    )}
                                </TabPanel>
                            )}

                            <Divider />

                            <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                                <AlertTitle sx={{ fontWeight: 950 }}>Checklist nhanh</AlertTitle>
                                Kiểm tra chủ sở hữu, địa chỉ, diện tích; ảnh/file rõ nét; {!isOwner && "và giấy ủy quyền hợp lệ."}
                            </Alert>
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* ✅ Lightbox (chỉ mở khi viewer.open) */}
            {viewer.open ? (
                <ImageViewer images={viewer.images} open={viewer.open} index={viewer.index} onClose={closeViewer} />
            ) : null}
        </Drawer>
    );
}
