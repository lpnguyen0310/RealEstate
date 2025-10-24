import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

export default function ConfirmModal({
    open,
    title = "Xác nhận",
    message = "Bạn có chắc chắn?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    severity = "default", // "default" | "error" | "warning"
    loading = false,
    onClose,
    onConfirm,
}) {
    const colorMap = {
        default: { btn: "primary", icon: "#415a8c" },
        warning: { btn: "warning", icon: "#f59e0b" },
        error: { btn: "error", icon: "#ef4444" },
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2.5, border: "1px solid #e8edf6", boxShadow: "0 12px 40px rgba(13,47,97,0.12)" },
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: "#1c396a" }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <WarningAmberRoundedIcon sx={{ color: colorMap[severity].icon }} />
                    <span>{title}</span>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "#eef2f9" }}>
                <Typography sx={{ color: "#50607a" }}>{message}</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color={colorMap[severity].btn}
                >
                    {loading ? "Đang xử lý..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
