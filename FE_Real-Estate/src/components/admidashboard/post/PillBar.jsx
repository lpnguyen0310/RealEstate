// PillBar.jsx
import React, { useMemo, useCallback } from "react";
import { Box, Stack, Typography, ButtonBase } from "@mui/material";

// nạp font chỉ cho file này (ok vì Vite/Webpack sẽ bundle 1 lần)
import "@fontsource-variable/inter"; // hoặc các weight cố định bạn cần

const FONT_STACK =
  `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`;

export default function PillBar({ selected, onSelect, counts = {} }) {
  const pills = useMemo(
    () => [
      { key: "PENDING_REVIEW", label: "Chờ duyệt", badgeBg: "#fde68a" },
      { key: "PUBLISHED", label: "Đang hiển thị", badgeBg: "#e6edf9" },
      { key: "EXPIRING_SOON", label: "Sắp hết hạn", badgeBg: "#fed7aa" },
      { key: "EXPIRED", label: "Hết hạn", badgeBg: "#cbd5e1" },
      { key: "HIDDEN", label: "Đã ẩn", badgeBg: "#cbd5e1" },
      { key: "REJECTED", label: "Bị từ chối", badgeBg: "#fecdd3" },
    ],
    []
  );

  const handleSelect = useCallback(
    (key) => (e) => {
      e.preventDefault();
      onSelect?.(key);
    },
    [onSelect]
  );

  return (
    <Stack
      direction="row"
      spacing={1.5}
      flexWrap="wrap"
      useFlexGap
      role="tablist"
      aria-label="Trạng thái bài đăng"
      sx={{ fontFamily: FONT_STACK, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
    >
      {pills.map((p) => {
        const active = selected === p.key;
        return (
          <ButtonBase
            key={p.key}
            onClick={handleSelect(p.key)}
            component="button"
            type="button"
            role="tab"
            aria-selected={active}
            sx={{
              fontFamily: "inherit",
              userSelect: "none",
              cursor: "pointer",
              px: 2.25,
              py: 1,
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
              bgcolor: active ? "#0f2350" : "#fff",
              color: active ? "#fff" : "#111827",
              display: "inline-flex",
              alignItems: "center",
              gap: 1.25,
              boxShadow: active ? "0 2px 6px rgba(15,35,80,.25)" : "none",
              outline: "none",
              "&:focus-visible": {
                boxShadow: "0 0 0 3px rgba(15, 35, 80, 0.35), 0 2px 6px rgba(15,35,80,.25)",
              },
            }}
          >
            <Typography sx={{ fontFamily: "inherit" }} fontWeight={700}>
              {p.label}
            </Typography>
            <Box
              sx={{
                fontFamily: "inherit",
                ml: 0.25,
                fontSize: 12,
                fontWeight: 700, // dùng 700 là đủ; nếu muốn 800, Inter-variable vẫn render ngon
                px: 1,
                lineHeight: "18px",
                height: 18,
                borderRadius: "8px",
                color: "#0f2350",
                bgcolor: active ? "#e6edf9" : p.badgeBg || "#eef2f7",
              }}
            >
              {counts?.[p.key] ?? 0}
            </Box>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
