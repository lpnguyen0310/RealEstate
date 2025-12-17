// CreatePostSection/LegalFilesUpload.jsx
import { useMemo, useRef, useState, useCallback } from "react";
import {
    Box,
    Typography,
    IconButton,
    Button,
    CircularProgress,
    Divider,
    Chip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { uploadMany } from "@/api/cloudinary";

// ===================== constants =====================
const ACCEPT = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/jpg",
    "image/png",
];

const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_FILES = 6;

// ===================== helpers =====================
const getExt = (name = "") => {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
};

const getNameFromUrl = (url) => {
    try {
        const u = new URL(url);
        return decodeURIComponent(u.pathname.split("/").pop() || "file");
    } catch {
        return String(url).split("/").pop() || "file";
    }
};

const extLabel = (ext) => (ext ? ext.toUpperCase() : "FILE");

const extIcon = (ext) => {
    if (ext === "pdf") return <PictureAsPdfIcon fontSize="small" />;
    if (ext === "doc" || ext === "docx") return <DescriptionIcon fontSize="small" />;
    if (ext === "xls" || ext === "xlsx") return <InsertDriveFileIcon fontSize="small" />;
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return <ImageOutlinedIcon fontSize="small" />;
    return <InsertDriveFileIcon fontSize="small" />;
};

const buildItems = (urls = []) =>
    (urls || []).map((url) => {
        const name = getNameFromUrl(url);
        const ext = getExt(name);
        return { url, name, ext };
    });

const validateFiles = (files) => {
    const ok = [];
    const errs = [];

    for (const f of files) {
        if (!ACCEPT.includes(f.type)) {
            errs.push(`Không hỗ trợ: ${f.name}`);
            continue;
        }
        if (f.size > MAX_SIZE) {
            errs.push(`Quá 15MB: ${f.name}`);
            continue;
        }
        ok.push(f);
    }

    return { ok, errs };
};

export default function LegalFilesUpload({
    title,
    required = false,
    hint,
    value = [], // string[] URLs
    onChange,
    errorText = "",
    folder = "properties/legal",
}) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [localErr, setLocalErr] = useState("");

    const items = useMemo(() => buildItems(value), [value]);
    const isMax = value.length >= MAX_FILES;

    const openPicker = useCallback(() => inputRef.current?.click(), []);

    const removeAt = useCallback(
        (idx) => {
            const next = value.filter((_, i) => i !== idx);
            onChange?.(next);
        },
        [value, onChange]
    );

    const uploadPickedFiles = useCallback(
        async (fileList) => {
            setLocalErr("");
            if (!fileList?.length) return;

            const remain = Math.max(0, MAX_FILES - value.length);
            const picked = Array.from(fileList).slice(0, remain);

            const { ok, errs } = validateFiles(picked);
            if (errs.length) setLocalErr(errs.join(" • "));
            if (!ok.length) return;

            try {
                setUploading(true);
                const rs = await uploadMany(ok, folder); // [{ secure_url }]
                const urls = rs.map((x) => x?.secure_url).filter(Boolean);
                onChange?.([...value, ...urls]);
            } catch (e) {
                setLocalErr(e?.message || "Upload thất bại");
            } finally {
                setUploading(false);
            }
        },
        [value, onChange, folder]
    );

    const uiError = errorText || localErr;

    return (
        <Box
            sx={{
                border: "1px solid #e1e5ee",
                borderRadius: 2,
                bgcolor: "#fff",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: "#0f223a", fontSize: 15 }}>
                    {title} {required ? <span style={{ color: "red" }}>*</span> : null}
                </Typography>
                {hint ? (
                    <Typography sx={{ color: "#64748b", fontSize: 13, mt: 0.5 }}>{hint}</Typography>
                ) : null}
            </Box>

            <Divider />

            {/* Body */}
            <Box sx={{ px: 2, py: 1.5 }}>
                {/* Empty */}
                {!items.length ? (
                    <Box
                        sx={{
                            border: "1px dashed #c7cfe0",
                            borderRadius: 2,
                            p: 2,
                            bgcolor: "#f8fafc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                        }}
                    >
                        <Typography sx={{ color: "#64748b", fontSize: 13 }}>Chưa có tệp nào.</Typography>
                        <Button
                            onClick={openPicker}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            disabled={uploading || isMax}
                        >
                            Thêm tệp
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {items.map((it, idx) => (
                            <Box
                                key={it.url}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 2,
                                    px: 1.2,
                                    py: 1,
                                    bgcolor: "#fff",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, minWidth: 0, flex: 1 }}>
                                    {extIcon(it.ext)}
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            color: "#0f223a",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                        title={it.name}
                                    >
                                        {it.name}
                                    </Typography>
                                    <Chip size="small" label={extLabel(it.ext)} sx={{ ml: 0.5, bgcolor: "#eef2ff" }} />
                                </Box>

                                <IconButton size="small" onClick={() => window.open(it.url, "_blank")} title="Xem">
                                    <OpenInNewIcon fontSize="small" />
                                </IconButton>

                                <IconButton size="small" onClick={() => removeAt(idx)} title="Xóa">
                                    <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button onClick={openPicker} startIcon={<AddIcon />} disabled={uploading || isMax}>
                                Thêm tệp
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Loading */}
                {uploading ? (
                    <Box sx={{ mt: 1.2, display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={18} />
                        <Typography sx={{ fontSize: 13, color: "#64748b" }}>Đang tải tệp lên...</Typography>
                    </Box>
                ) : null}

                {/* Errors */}
                {uiError ? (
                    <Typography sx={{ mt: 1, fontSize: 13, color: "#ef4444" }}>{uiError}</Typography>
                ) : null}
            </Box>

            {/* Hidden input */}
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT.join(",")}
                hidden
                onChange={(e) => {
                    uploadPickedFiles(e.target.files);
                    e.target.value = "";
                }}
            />
        </Box>
    );
}
