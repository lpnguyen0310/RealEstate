import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
    Paper, Button
} from "@mui/material";
import { TRANSACTIONS } from "@/data/Dashboard/OrderManagementData";

export default function OrderDetailModal({ open, onClose, order }) {
    if (!order) return null;

    // lọc giao dịch liên quan
    const txList = TRANSACTIONS.filter(tx => tx.orderCode === order.code);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 18,
                    backgroundColor: "#F0F5FF", // nền xanh nhạt
                    px: 2.5,
                    py: 2.5,
                }}
            >
                Chi tiết đơn hàng

                {/* Nút X */}
                <Box
                    component="button"
                    onClick={onClose}
                    sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#E4EBFF",
                        color: "#1E3A8A",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "0.2s",
                        "&:hover": {
                            backgroundColor: "#d7e2ff",
                        },
                    }}
                >
                    ×
                </Box>
            </DialogTitle>


            <DialogContent dividers sx={{ backgroundColor: "#F0F5FF" }}>
                {/* ==== Thông tin đơn hàng ==== */}
                <Paper
                    sx={{
                        p: 2.5,
                        mb: 3,
                        bgcolor: "#eaf2ff",          // xanh nhạt hơn một chút
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            // xs: 1 cột; >=sm: 4 cột (label-value | label-value)
                            gridTemplateColumns: { xs: "1fr", sm: "auto 1fr auto 1fr" },
                            columnGap: { xs: 2, sm: 6 },
                            rowGap: 1.5,
                            alignItems: "center",
                        }}
                    >
                        {/* Row 1: Mã đơn hàng | Trạng thái */}
                        <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>
                            Mã đơn hàng
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>{order.code}</Typography>

                        <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>
                            Trạng thái
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                color:
                                    order.status === "Thành công"
                                        ? "#1aa260"
                                        : order.status === "Đang xử lý"
                                            ? "#f28c38"
                                            : "#e53935",
                                textAlign: { xs: "left", sm: "right" }, // canh phải như ảnh
                            }}
                        >
                            {order.status}
                        </Typography>

                        {/* Row 2: Ngày tạo đơn | Tổng thanh toán */}
                        <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>
                            Ngày tạo đơn
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>{order.createdAt}</Typography>

                        <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>
                            Tổng thanh toán
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                textAlign: { xs: "left", sm: "right" },
                                color: "#2b3a55",
                            }}
                        >
                            {order.amount}
                        </Typography>
                    </Box>
                </Paper>


                {/* ==== Danh sách gói tin đã mua ==== */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography fontWeight={700} mb={1.5}>Danh sách gói tin đã mua</Typography>
                    {order.items?.length ? (
                        <Table size="small">
                            <TableHead sx={{
                                backgroundColor: "#f3f7ff",       // màu nền xanh nhạt
                                "& th": {
                                    fontWeight: 700,               // chữ đậm
                                    color: "#1a2b4c",              // màu xanh đậm chữ
                                    fontSize: 14,
                                    borderBottom: "none",
                                    paddingY: 1.2,
                                },
                            }}>
                                <TableRow>
                                    <TableCell>Tên gói</TableCell>
                                    <TableCell align="right">Số lượng</TableCell>
                                    <TableCell align="right">Giá</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{
                                "& td": { py: 1.5 },
                            }}>
                                {order.items.map((it, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{it.name}</TableCell>
                                        <TableCell align="right">{it.qty}</TableCell>
                                        <TableCell align="right">
                                            {it.priceVND.toLocaleString("vi-VN")} VNĐ
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Tổng cộng</TableCell>
                                    <TableCell /> {/* cột trống giữa */}
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 700,
                                            color: "#e53935", // màu đỏ cho tổng tiền
                                        }}
                                    >
                                        {order.items
                                            .reduce((sum, it) => sum + it.qty * it.priceVND, 0)
                                            .toLocaleString("vi-VN")}{" "}
                                        VNĐ
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography color="text.secondary">Không có dữ liệu gói tin.</Typography>
                    )}
                </Paper>

                {/* ==== Thông tin giao dịch ==== */}
                <Paper sx={{ p: 2 }}>
                    <Typography fontWeight={700} mb={1.5}>Thông tin giao dịch</Typography>
                    {txList.length === 0 ? (
                        <Typography color="text.secondary">Không có giao dịch nào.</Typography>
                    ) : (
                        <Table size="small">
                            <TableHead
                                sx={{
                                    backgroundColor: "#f3f7ff",       // màu nền xanh nhạt
                                    "& th": {
                                        fontWeight: 700,               // chữ đậm
                                        color: "#1a2b4c",              // màu xanh đậm chữ
                                        fontSize: 14,
                                        borderBottom: "none",
                                        paddingY: 1.2,
                                    },
                                }}
                            >
                                <TableRow>
                                    <TableCell>Mã giao dịch</TableCell>
                                    <TableCell>Thời gian</TableCell>
                                    <TableCell>Loại giao dịch</TableCell>
                                    <TableCell>Số tiền</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{
                                "& td": { py: 1.5 },
                            }}>
                                {txList.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.id}</TableCell>
                                        <TableCell>{tx.createdAt}</TableCell>
                                        <TableCell>{tx.type}</TableCell>
                                        <TableCell>{tx.amount}</TableCell>
                                        <TableCell>
                                            <span style={{
                                                color:
                                                    tx.status === "Thành công"
                                                        ? "#1aa260"
                                                        : tx.status === "Đang xử lý"
                                                            ? "#f28c38"
                                                            : "#e53935",
                                                fontWeight: 600,
                                            }}>
                                                {tx.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={onClose}>Đóng</Button>
                <Button variant="contained" color="primary">Mua lại</Button>
            </DialogActions>
        </Dialog>
    );
}
