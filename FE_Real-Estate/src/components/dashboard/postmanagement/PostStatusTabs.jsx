import React, { useMemo, useCallback } from "react";
import { Box, Stack, Typography, ButtonBase } from "@mui/material";
import "@fontsource-variable/inter";

const FONT_STACK =
    `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`;

export default function PostStatusTabs({
    activeKey = "active",
    onChange = () => { },
    counts = {},
}) {
    const TABS = useMemo(
        () => [
            { key: "active", label: "Đang Đăng", badgeBg: "#d1fae5" },
            { key: "pending", label: "Chờ Duyệt", badgeBg: "#fde68a" },
            { key: "draft", label: "Nháp", badgeBg: "#e0e7ff" },
            { key: "rejected", label: "Bị Từ Chối", badgeBg: "#fecdd3" },
            { key: "expired", label: "Hết Hạn", badgeBg: "#cbd5e1" },
            { key: "expiringSoon", label: "Sắp hết hạn", badgeBg: "#fed7aa" },
            { key: "hidden", label: "Đã Ẩn", badgeBg: "#e5e7eb" },
            { key: "warned", label: "Bị Cảnh Cáo", badgeBg: "#fef08a" },
            { key: "archived", label: "Thành Công", badgeBg: "#e2e8f0" },
        ],
        []
    );

    const handleSelect = useCallback(
        (key) => (e) => {
            e.preventDefault();
            onChange?.(key);
        },
        [onChange]
    );

    return (
        <Box
            role="tablist"
            aria-label="Trạng thái bài đăng"
            sx={{
                fontFamily: FONT_STACK,
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflowX: "auto",                   // luôn cho cuộn ngang khi tràn
                overflowY: "hidden",
                pb: { xs: 0.5, sm: 0 },
                scrollSnapType: { xs: "x mandatory", sm: "none" }, // snap chỉ mobile
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { height: 0 },
                scrollbarWidth: "none",
            }}
        >
            <Stack
                direction="row"
                spacing={1.5}
                sx={{
                    display: "inline-flex",
                    minWidth: "max-content",           // tạo nhu cầu cuộn theo nội dung
                }}
            >
                {TABS.map((t) => {
                    const active = activeKey === t.key;
                    const raw = counts?.[t.key] ?? 0;
                    const display = raw > 99 ? "99+" : raw;

                    return (
                        <ButtonBase
                            key={t.key}
                            onClick={handleSelect(t.key)}
                            component="button"
                            type="button"
                            role="tab"
                            aria-selected={active}
                            sx={{
                                flex: "0 0 auto",
                                scrollSnapAlign: { xs: "start", sm: "none" },
                                userSelect: "none",
                                cursor: "pointer",
                                px: 2,
                                py: 0.875,
                                borderRadius: "16px",
                                border: "1px solid #e5e7eb",
                                bgcolor: active ? "#0f2350" : "#fff",
                                color: active ? "#fff" : "#111827",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                boxShadow: active ? "0 2px 6px rgba(15,35,80,.25)" : "none",
                                outline: "none",
                                height: 36,
                                whiteSpace: "nowrap",
                                "&:focus-visible": {
                                    boxShadow:
                                        "0 0 0 3px rgba(15, 35, 80, 0.35), 0 2px 6px rgba(15,35,80,.25)",
                                },
                            }}
                        >
                            <Typography sx={{ fontFamily: "inherit" }} fontWeight={700} fontSize={13.5}>
                                {t.label}
                            </Typography>
                            <Box
                                sx={{
                                    fontFamily: "inherit",
                                    ml: 0.25,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    px: 1,
                                    lineHeight: "18px",
                                    height: 18,
                                    borderRadius: "8px",
                                    color: "#0f2350",
                                    bgcolor: active ? "#e6edf9" : t.badgeBg || "#eef2f7",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {display}
                            </Box>
                        </ButtonBase>
                    );
                })}
            </Stack>
        </Box>
    );
}
