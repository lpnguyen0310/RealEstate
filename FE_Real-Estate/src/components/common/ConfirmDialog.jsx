import * as React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Stack
} from "@mui/material";

export default function ConfirmDialog({
    open,
    title = "Xác nhận",
    content = "",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    loading = false,
    onClose,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={1}>
                    {typeof content === "string" ? (
                        <Typography sx={{ mt: 0.5, color: "#475569" }}>{content}</Typography>
                    ) : content}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading} variant="text">
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                >
                    {loading ? "Đang xử lý..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
