import { useEffect, useRef, useState, useMemo } from "react";
import { Box, Card, CardContent, Divider, Typography, IconButton, Chip, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 12;

/**
 * Props:
 *  - images: (File|string)[]           // Ảnh công khai (có thể thêm/xoá)
 *  - onChange(nextArr)                 // cập nhật ảnh công khai
 *  - appendedImages: string[]          // Ảnh phụ từ "Chính chủ & Ảnh xây dựng" (chỉ hiển thị nối đuôi)
 */
export default function PublicImagesSection({ images = [], onChange, appendedImages = [] }) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // ===== PREVIEW CHO PUBLIC IMAGES =====
    const [publicPreviews, setPublicPreviews] = useState([]);
    useEffect(() => {
        const urls = (images || []).map((it) => (typeof it === "string" ? it : URL.createObjectURL(it)));
        setPublicPreviews(urls);
        return () => {
            urls.forEach((u) => { if (u?.startsWith?.("blob:")) URL.revokeObjectURL(u); });
        };
    }, [images]);

    // ===== PREVIEW CHO APPENDED (OWNER IMAGES) =====
    const ownerPreviews = useMemo(() => {
        // appendedImages dự kiến là string URL đã upload (Cloudinary…)
        return (appendedImages || []).filter(Boolean);
    }, [appendedImages]);

    const triggerPick = () => fileInputRef.current?.click();

    const handleFiles = (fileList) => {
        if (!fileList?.length) return;

        const current = images.slice();
        const remain = Math.max(0, MAX_FILES - current.length);

        const errors = [];
        Array.from(fileList)
            .slice(0, remain)
            .forEach((f) => {
                if (!ACCEPT.includes(f.type)) {
                    errors.push(`Tệp không hợp lệ: ${f.name}`);
                    return;
                }
                if (f.size > MAX_SIZE) {
                    errors.push(`Quá 10MB: ${f.name}`);
                    return;
                }
                current.push(f);
            });

        onChange?.(current);
        if (errors.length) console.warn(errors.join("\n")); // TODO: có thể thay bằng toast
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeAt = (idx) => {
        const next = images.slice();
        next.splice(idx, 1);
        onChange?.(next);
    };

    const hasAnyImage = (images && images.length > 0) || (ownerPreviews && ownerPreviews.length > 0);
    const canAddMore = images.length < MAX_FILES;

    return (
        <Card variant="outlined" sx={{ borderRadius: "16px", borderColor: "#e1e5ee", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}>
                    Hình ảnh công khai <span style={{ color: "red" }}>*</span>
                </Typography>
                <Typography sx={{ color: "#64748b", mt: 0.5, mb: 1 }}>
                    Tải lên những hình ảnh bạn muốn chia sẻ với khách hàng. Ảnh từ mục <b>Chính chủ &amp; Ảnh xây dựng</b> sẽ tự nối ở cuối (chỉ hiển thị).
                </Typography>
                <Divider sx={{ borderColor: "#0f223a", mb: 2 }} />

                {/* Empty state */}
                {!hasAnyImage && (
                    <Box
                        onClick={triggerPick}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                        onDrop={onDrop}
                        sx={{
                            cursor: "pointer",
                            border: "2px dashed #d6dee8",
                            bgcolor: dragOver ? "#eef4ff" : "#eef2f6",
                            color: "#64748b",
                            borderRadius: "12px",
                            p: 4,
                            textAlign: "center",
                            transition: "all .15s ease",
                        }}
                    >
                        <CloudUploadOutlinedIcon sx={{ fontSize: 48, opacity: 0.7, mb: 1 }} />
                        <Typography sx={{ fontWeight: 600 }}>
                            Kéo và thả ảnh vào đây hoặc nhấp để chọn tệp
                        </Typography>
                        <Typography sx={{ fontSize: 13, mt: 0.5 }}>
                            (JPG, JPEG, PNG • &lt; 10MB mỗi ảnh)
                        </Typography>
                    </Box>
                )}

                {/* Has images (public + owner-append) */}
                {hasAnyImage && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(6, 1fr)" },
                            gap: 1.5,
                        }}
                    >
                        {/* 1) PUBLIC IMAGES (có thể xoá) */}
                        {images.map((_, idx) => (
                            <Box
                                key={`pub-${idx}`}
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
                                    bgcolor: "#f1f5f9",
                                }}
                            >
                                <img
                                    src={publicPreviews[idx]}
                                    alt={`upload-${idx}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <IconButton
                                    aria-label="remove"
                                    onClick={() => removeAt(idx)}
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        bgcolor: "rgba(255,255,255,.9)",
                                        border: "1px solid #e2e8f0",
                                        "&:hover": { bgcolor: "#fff" },
                                    }}
                                >
                                    <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}

                        {/* Add tile cho PUBLIC (nếu chưa đủ) */}
                        {canAddMore && (
                            <Box
                                onClick={triggerPick}
                                sx={{
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                    aspectRatio: "1 / 1",
                                    borderRadius: "12px",
                                    border: "2px dashed #c7cfe0",
                                    color: "#20407a",
                                    bgcolor: "#f3f6fb",
                                }}
                            >
                                <AddIcon />
                            </Box>
                        )}

                        {/* 2) OWNER / CONSTRUCTION IMAGES (append, read-only) */}
                        {ownerPreviews.map((src, idx) => (
                            <Box
                                key={`owner-${idx}`}
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
                                    bgcolor: "#f1f5f9",
                                }}
                            >
                                <img
                                    src={src}
                                    alt={`construction-${idx}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <Tooltip title="Ảnh từ 'Chính chủ & Ảnh xây dựng' – chỉnh sửa tại mục đó">
                                    <Chip
                                        label="Xây dựng"
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            top: 6,
                                            left: 6,
                                            bgcolor: "rgba(15,23,42,.85)",
                                            color: "#fff",
                                            "& .MuiChip-label": { px: 1 },
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                        ))}
                    </Box>
                )}

                <input
                    type="file"
                    accept={ACCEPT.join(",")}
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                    hidden
                />
            </CardContent>
        </Card>
    );
}
