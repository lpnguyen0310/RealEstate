import { useSelector } from 'react-redux'; // ✨ 1. CHỈ CẦN IMPORT useSelector
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Button
} from "@mui/material";
import dayjs from "dayjs";

// --- Các hàm hỗ trợ định dạng (giữ nguyên) ---
const formatOrderStatus = (status) => {
  switch (status) {
    case 'PAID': return { text: 'Thành công', color: '#1aa260' };
    case 'PENDING_PAYMENT': return { text: 'Đang xử lý', color: '#f28c38' };
    case 'CANCELED': return { text: 'Đã hủy', color: '#e53935' };
    default: return { text: status, color: 'grey' };
  }
};
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  return dayjs(isoString).format('DD/MM/YYYY HH:mm');
};
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};


export default function OrderDetailModal({ open, onClose, order }) {

  const { myOrders } = useSelector((state) => state.orders);

  if (!order) return null;

  // ✨ 4. LỌC RA CÁC ĐƠN HÀNG CÒN LẠI
  const otherOrders = myOrders.filter(o => o.orderId !== order.orderId);

  const statusInfo = formatOrderStatus(order.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontWeight: 700, fontSize: 18, backgroundColor: "#F0F5FF",
          px: 2.5, py: 2.5,
        }}
      >
        Chi tiết đơn hàng
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 28, height: 28, borderRadius: "8px", border: "none",
            backgroundColor: "#E4EBFF", color: "#1E3A8A", fontWeight: "bold",
            cursor: "pointer", transition: "0.2s",
            "&:hover": { backgroundColor: "#d7e2ff" },
          }}
        >
          ×
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "#F0F5FF" }}>
        {/* ==== Thông tin đơn hàng ==== (Giữ nguyên) */}
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: "#eaf2ff", borderRadius: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr auto 1fr" }, columnGap: { xs: 2, sm: 6 }, rowGap: 1.5, alignItems: "center" }}>
                <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>Mã đơn hàng</Typography>
                <Typography sx={{ fontWeight: 500 }}>{order.orderId}</Typography>
                <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>Trạng thái</Typography>
                <Typography sx={{ fontWeight: 700, color: statusInfo.color, textAlign: { xs: "left", sm: "right" } }}>
                {statusInfo.text}
                </Typography>
                <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>Ngày tạo đơn</Typography>
                <Typography sx={{ fontWeight: 500 }}>{formatDateTime(order.createdAt)}</Typography>
                <Typography sx={{ fontWeight: 700, color: "#1a2b4c" }}>Tổng thanh toán</Typography>
                <Typography sx={{ fontWeight: 700, textAlign: { xs: "left", sm: "right" }, color: "#2b3a55" }}>
                {formatCurrency(order.total)}
                </Typography>
            </Box>
        </Paper>

        {/* ==== Danh sách gói tin đã mua ==== (Giữ nguyên) */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography fontWeight={700} mb={1.5}>Danh sách gói tin đã mua</Typography>
          {order.items?.length ? (
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f3f7ff", "& th": { fontWeight: 700, color: "#1a2b4c", fontSize: 14, borderBottom: "none", paddingY: 1.2 } }}>
                <TableRow>
                  <TableCell>Tên gói</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell align="right">Thành tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ "& td": { py: 1.5 } }}>
                {order.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.title}</TableCell>
                    <TableCell align="right">{it.qty}</TableCell>
                    <TableCell align="right">{formatCurrency(it.lineTotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, borderBottom: 'none' }}>Tổng cộng</TableCell>
                  <TableCell sx={{ borderBottom: 'none' }} />
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#e53935", borderBottom: 'none' }}>
                    {formatCurrency(order.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Không có dữ liệu gói tin.</Typography>
          )}
        </Paper>

        {/* ==== ✨ 5. CẬP NHẬT PHẦN NÀY ĐỂ HIỂN THỊ "CÁC ĐƠN HÀNG KHÁC" ==== */}
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={700} mb={1.5}>Các đơn hàng khác</Typography>
          {otherOrders.length === 0 ? (
            <Typography color="text.secondary">Không có đơn hàng nào khác.</Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#f3f7ff", "& th": { fontWeight: 700, color: "#1a2b4c", fontSize: 14, borderBottom: "none", paddingY: 1.2 } }}>
                <TableRow>
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Số tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ "& td": { py: 1.5 } }}>
                {otherOrders.map((other) => {
                  const otherStatus = formatOrderStatus(other.status);
                  return (
                    <TableRow key={other.orderId}>
                      <TableCell>{other.orderId}</TableCell>
                      <TableCell>{formatDateTime(other.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(other.total)}</TableCell>
                      <TableCell sx={{ color: otherStatus.color, fontWeight: 'bold' }}>{otherStatus.text}</TableCell>
                    </TableRow>
                  );
                })}
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