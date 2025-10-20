import React, { useMemo, useCallback } from "react";
import { Box, Stack, Typography, ButtonBase } from "@mui/material";

export default function PillBar({ selected, onSelect, counts = {} }) {
    // Danh sách pill
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

    // Handler chọn tab
    const handleSelect = useCallback(
        (key) => (e) => {
            e.preventDefault(); // chặn reload form
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
        >
            {pills.map((p) => {
                const active = selected === p.key;
                return (
                    <ButtonBase
                        key={p.key}
                        onClick={handleSelect(p.key)}
                        component="button"
                        type="button" // KHÔNG submit form
                        role="tab"
                        aria-selected={active}
                        sx={{
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
                                boxShadow:
                                    "0 0 0 3px rgba(15, 35, 80, 0.35), 0 2px 6px rgba(15,35,80,.25)",
                            },
                        }}
                    >
                        <Typography fontWeight={800}>{p.label}</Typography>
                        <Box
                            sx={{
                                ml: 0.25,
                                fontSize: 12,
                                fontWeight: 800,
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
