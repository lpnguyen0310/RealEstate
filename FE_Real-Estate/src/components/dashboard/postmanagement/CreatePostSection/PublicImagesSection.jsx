import { useRef, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Divider,
    Typography,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 12;

export default function PublicImagesSection({ images = [], onChange }) {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const triggerPick = () => fileInputRef.current?.click();

    const toPreview = (file) =>
        typeof file === "string" ? file : URL.createObjectURL(file);

    const handleFiles = (fileList) => {
        if (!fileList?.length) return;

        const current = images.slice();
        const errors = [];
        for (const f of Array.from(fileList)) {
            if (!ACCEPT.includes(f.type)) {
                errors.push(`Tệp không hợp lệ: ${f.name}`);
                continue;
            }
            if (f.size > MAX_SIZE) {
                errors.push(`Quá 10MB: ${f.name}`);
                continue;
            }
            if (current.length >= MAX_FILES) break;
            current.push(f);
        }
        onChange?.(current);

        // optional: log lỗi (có thể thay bằng toast)
        if (errors.length) console.warn(errors.join("\n"));
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

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: "16px",
                borderColor: "#e1e5ee",
                boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: 18 }}>
                    Hình ảnh công khai <span style={{ color: "red" }}>*</span>
                </Typography>
                <Typography sx={{ color: "#64748b", mt: 0.5, mb: 1 }}>
                    Tải lên những hình ảnh bạn muốn chia sẻ với khách hàng.
                </Typography>
                <Divider sx={{ borderColor: "#0f223a", mb: 2 }} />

                {/* State: no images */}
                {(!images || images.length === 0) && (
                    <Box
                        onClick={triggerPick}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOver(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOver(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOver(false);
                        }}
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
                            (Các loại tệp được hỗ trợ: JPG, JPEG, PNG với kích thước tệp dưới 10MB)
                        </Typography>
                    </Box>
                )}

                {/* State: has images */}
                {images && images.length > 0 && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(4, 1fr)",
                                sm: "repeat(6, 1fr)",
                            },
                            gap: 1.5,
                        }}
                    >
                        {images.map((img, idx) => (
                            <Box
                                key={idx}
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
                                    src={toPreview(img)}
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

                        {/* Add tile */}
                        {images.length < MAX_FILES && (
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
                    </Box>
                )}

                <input
                    type="file"
                    accept={ACCEPT.join(",")}
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        // reset để chọn trùng tên vẫn nhận
                        e.target.value = "";
                    }}
                    hidden
                />
            </CardContent>
        </Card>
    );
}
