// src/components/dashboard/transactionsmanagement/TxTabs.jsx
import { useMemo } from "react";
import { Paper, Box, Button, Chip } from "@mui/material";

/** Tabs: Đang xử lý | Thành công | Thất bại
 *  - Kéo ngang trên mobile (overflow-x)
 */
export default function TxTabs({
    active = "processing", // 'processing' | 'success' | 'failed'
    counts = { processing: 0, success: 0, failed: 0 },
    onChange = () => { },
}) {
    const TABS = useMemo(
        () => [
            { key: "processing", label: "Đang Xử Lý" },
            { key: "success", label: "Thành Công" },
            { key: "failed", label: "Thất Bại" },
        ],
        []
    );

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                borderRadius: "12px",
                border: "1px solid #e8edf6",
                boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
                backgroundColor: "#fff",
            }}
            className="min-w-0"
        >
            {/* Lớp ngoài: cho phép kéo ngang, ẩn scrollbar */}
            <Box sx={{ overflowX: "auto" }} className="no-scrollbar">
                {/* Lớp trong: width theo nội dung để có bề ngang thật sự */}
                <Box sx={{ display: "flex", gap: 1.5, width: "max-content" }}>
                    {TABS.map((t) => {
                        const selected = active === t.key;
                        const count =
                            t.key === "processing"
                                ? counts.processing
                                : t.key === "success"
                                    ? counts.success
                                    : counts.failed;

                        return (
                            <Button
                                key={t.key}
                                onClick={() => onChange(t.key)}
                                disableRipple
                                sx={{
                                    px: 2.5,
                                    height: 40,
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    color: selected ? "#fff" : "#1a2b4d",
                                    backgroundColor: selected ? "#102a52" : "#fff",
                                    border: selected ? "1px solid transparent" : "1px solid rgba(0,0,0,.12)",
                                    "&:hover": {
                                        backgroundColor: selected ? "#102a52" : "#f8fafc",
                                    },
                                    gap: 1,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t.label}
                                <Chip
                                    label={count}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontWeight: 700,
                                        color: selected ? "#102a52" : "#1a2b4d",
                                        backgroundColor: selected ? "#fff" : "#eef2ff",
                                    }}
                                />
                            </Button>
                        );
                    })}
                </Box>
            </Box>
        </Paper>
    );
}
