import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Paper, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const statusColor = (s) =>
    s === "Thành công" ? "#1aa260" : s === "Đang xử lý" ? "#f28c38" : "#e53935";

export default function TransactionDetailModal({ open, onClose, tx }) {
    if (!tx) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { backgroundColor: "#F0F5FF" } // nền dialog
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 20,
                    backgroundColor: "#F0F5FF",
                    px: 3,
                    py: 2.2,
                }}
            >
                Chi tiết giao dịch
                <IconButton
                    onClick={onClose}
                    aria-label="close"
                    sx={{
                        ml: 1,
                        backgroundColor: "#e6eefc",
                        borderRadius: "10px",
                        "&:hover": { backgroundColor: "#dbe7ff" },
                    }}
                >
                    <CloseIcon sx={{ color: "#284b8f" }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ backgroundColor: "#F0F5FF", pb: 3 }}>
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: "12px",
                        backgroundColor: "#ffffff",
                    }}
                >
                    {/* 2 cột thông tin */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 3,
                        }}
                    >
                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Số tiền</Typography>
                            <Typography sx={{ mt: 0.5, color: "#1f4599", fontWeight: 700 }}>
                                {tx.amount}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Loại giao dịch</Typography>
                            <Typography sx={{ mt: 0.5 }}>{tx.type}</Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Trạng thái</Typography>
                            <Typography sx={{ mt: 0.5, fontWeight: 700, color: statusColor(tx.status) }}>
                                {tx.status}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Mã giao dịch</Typography>
                            <Typography sx={{ mt: 0.5 }}>{tx.txCode ?? "-"}</Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Nội dung chuyển khoản</Typography>
                            <Typography sx={{ mt: 0.5 }}>
                                {tx.orderCode || "---"}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight={600} color="#5c6370">Lý do từ chối</Typography>
                            <Typography sx={{ mt: 0.5 }}>
                                {tx.reason || "---"}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </DialogContent>
        </Dialog>
    );
}
