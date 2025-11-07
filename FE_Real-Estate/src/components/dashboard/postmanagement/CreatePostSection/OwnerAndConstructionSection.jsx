// src/components/dashboard/postmanagement/OwnerAndConstructionSection.jsx
import React, { useState } from "react";
import {
  Box, Card, CardContent, Divider, Typography, FormControl, Select, MenuItem,
  TextField, FormHelperText, Checkbox, FormControlLabel, IconButton, Button,
  CircularProgress
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { uploadMany } from "@/api/cloudinary";

/**
 * Props:
 *  - ownerValue: {
 *      isOwner: boolean,
 *      ownerName?: string,
 *      idNumber?: string,
 *      relationship?: string,
 *      agreed?: boolean
 *    }
 *  - onOwnerChange(nextObj)
 *  - imagesValue: string[]
 *  - onImagesChange(nextArr)
 *  - errors: { ownerName?, idNumber? }
 */
export default function OwnerAndConstructionSection({
  ownerValue,
  onOwnerChange,
  imagesValue = [],
  onImagesChange,
  errors = {},
}) {
  const v = ownerValue || {};
  const setOwner = (k, val) => onOwnerChange?.({ ...v, [k]: val });

  const inputRootSx = {
    borderRadius: "10px",
    backgroundColor: "#fff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e1e5ee" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c7cfe0" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" },
  };

  const selectSx = {
    "& .MuiOutlinedInput-root": inputRootSx,
    "& .MuiSelect-select": { py: "8px !important", color: "#1e293b" },
  };

  const smallMenuProps = {
    PaperProps: {
      sx: {
        maxHeight: 280,
        borderRadius: 2,
        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      },
    },
    MenuListProps: { dense: true, sx: { py: 0 } },
    anchorOrigin: { vertical: "bottom", horizontal: "left" },
    transformOrigin: { vertical: "top", horizontal: "left" },
  };
  const itemSx = { minHeight: 32, py: 0.5, fontSize: 14 };

  /* ================== Upload ảnh xây dựng ================== */
  const [uploading, setUploading] = useState(false);
  const handlePickFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setUploading(true);
    try {
      const res = await uploadMany(files, { folder: "realestate/construction" });
      const urls = (res || []).map((x) => x.secure_url || x.url).filter(Boolean);
      onImagesChange?.([...(imagesValue || []), ...urls]);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx) => {
    const next = [...(imagesValue || [])];
    next.splice(idx, 1);
    onImagesChange?.(next);
  };

  // Drag & drop reorder (HTML5)
  const [dragIdx, setDragIdx] = useState(null);
  const onDragStart = (i) => () => setDragIdx(i);
  const onDragOver = (i) => (e) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...(imagesValue || [])];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setDragIdx(i);
    onImagesChange?.(next);
  };
  const onDragEnd = () => setDragIdx(null);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "14px",
        borderColor: "#e1e5ee",
        boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
        transition: "box-shadow .2s ease",
        "&:hover": { boxShadow: "0 4px 16px rgba(15,23,42,0.08)" },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f223a", fontSize: "18px", mb: 1.5 }}>
          Chính chủ & Ảnh xây dựng
        </Typography>
        <Divider sx={{ borderColor: "#000", mb: 2 }} />

        {/* ===== Thông tin chính chủ ===== */}
        <Typography sx={{ fontWeight: 600, color: "#475569", mb: 1 }}>
          Thông tin chính chủ
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          {/* Loại người đăng */}
          <FormControl size="small" sx={selectSx}>
            <Select
              displayEmpty
              value={v.isOwner ? "owner" : "not_owner"}
              onChange={(e) => setOwner("isOwner", e.target.value === "owner")}
              MenuProps={smallMenuProps}
            >
              <MenuItem value="owner" sx={itemSx}>Chính chủ</MenuItem>
              <MenuItem value="not_owner" sx={itemSx}>Không phải chính chủ</MenuItem>
            </Select>
            <FormHelperText>Chọn đúng để tăng độ tin cậy</FormHelperText>
          </FormControl>

          {/* Quan hệ nếu không chính chủ */}
          {!v.isOwner && (
            <TextField
              size="small"
              label="Quan hệ với chủ sở hữu"
              placeholder="VD: Người thân / Môi giới / Uỷ quyền…"
              value={v.relationship || ""}
              onChange={(e) => setOwner("relationship", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": inputRootSx }}
            />
          )}

          {/* Họ và tên */}
          <TextField
            size="small"
            required
            label="Họ và tên chủ sở hữu"
            value={v.ownerName || ""}
            onChange={(e) => setOwner("ownerName", e.target.value)}
            error={!!errors.ownerName}
            helperText={errors.ownerName || ""}
            sx={{ "& .MuiOutlinedInput-root": inputRootSx }}
          />

          {/* CMND/CCCD */}
          <TextField
            size="small"
            required
            label="Số CMND/CCCD"
            value={v.idNumber || ""}
            onChange={(e) => setOwner("idNumber", e.target.value)}
            error={!!errors.idNumber}
            helperText={errors.idNumber || ""}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            sx={{ "& .MuiOutlinedInput-root": inputRootSx }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1 }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "#64748b", mt: "2px" }} />
          <Typography sx={{ fontSize: 13, color: "#64748b" }}>
            Thông tin chỉ phục vụ xác thực, không hiển thị công khai trừ khi bạn cho phép.
          </Typography>
        </Box>

        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={
            <Checkbox
              checked={!!v.agreed}
              onChange={(e) => setOwner("agreed", e.target.checked)}
            />
          }
          label="Tôi cam kết thông tin trên là đúng sự thật và chịu trách nhiệm hoàn toàn."
        />

        {/* ===== Ảnh xây dựng ===== */}
        <Typography sx={{ fontWeight: 600, color: "#475569", mt: 2.5, mb: 1 }}>
          Ảnh xây dựng (tiến độ/giấy phép/hiện trạng)
        </Typography>

        <Box
          sx={{
            p: 1.6,
            borderRadius: "12px",
            border: "1px solid #e6ebf4",
            bgcolor: "#f9fbff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#64748b" }}>
            Tối đa ~10–15 ảnh, nên giữ &lt; 2MB/ảnh.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            component="label"
            sx={{ borderColor: "#d7def0", color: "#0f223a", textTransform: "none" }}
          >
            Thêm ảnh
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handlePickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            gap: 2.5,
          }}
        >
          {imagesValue?.map((url, i) => (
            <Box
              key={url + i}
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDragEnd={onDragEnd}
              sx={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #e5ecff",
                bgcolor: "#fff",
              }}
            >
              {/* Image */}
              <Box
                component="img"
                src={url}
                alt={`construction-${i}`}
                sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
              />
              {/* Controls */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  p: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: "linear-gradient(to top, rgba(0,0,0,.45), transparent)",
                }}
              >
                <IconButton size="small" sx={{ bgcolor: "rgba(255,255,255,0.9)" }} title="Kéo để sắp xếp">
                  <DragIndicatorIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => removeAt(i)}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#ef4444" }}
                  title="Xoá"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}

          {/* Add tile */}
          <Button
            variant="outlined"
            component="label"
            sx={{
              height: 160,
              borderRadius: "12px",
              borderStyle: "dashed",
              borderColor: "#d7def0",
              color: "#3a5e96",
              display: "grid",
              placeItems: "center",
              "&:hover": { bgcolor: "#f6f9ff" },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: .5 }}>
              <AddIcon />
              <Typography sx={{ fontSize: 12 }}>Thêm ảnh</Typography>
            </Box>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handlePickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </Button>
        </Box>

        {uploading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
            <CircularProgress size={18} />
            <Typography sx={{ fontSize: 13, color: "#64748b" }}>Đang tải ảnh lên…</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
