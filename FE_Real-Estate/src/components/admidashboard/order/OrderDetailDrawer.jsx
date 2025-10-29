import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Drawer, Paper, Stack, Avatar, Typography, Chip, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Button,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import { message } from "antd";
import { STATUS_COLOR, METHOD_BADGE } from "./constants";
import { fmtDateOrder, fmtVND } from "@/utils/validators";
// CHỈNH SỬA: Dùng API thực tế
import { adminOrdersApi } from "@/api/adminApi/adminOrdersApi"; 

function InfoBlock({ label, value }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  );
}

export default function OrderDetailDrawer({ open, onClose, orderId }) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchDetail = useCallback(async () => {
    // [KIỂM TRA AN TOÀN] Đảm bảo ID là số hợp lệ
    if (!orderId || isNaN(Number(orderId))) {
        setDetail(null); // Reset nếu ID không hợp lệ
        return;
    } 
    
    setLoading(true);
    try { 
        // GỌI API THỰC TẾ
        setDetail(await adminOrdersApi.getById(orderId)); 
    }
    catch (e) { 
        console.error("Lỗi khi tải chi tiết đơn hàng:", e);
        message.error("Không tải được chi tiết đơn hàng."); 
    }
    finally { setLoading(false); }
  }, [orderId]);

  // GỌI API khi Drawer mở HOẶC orderId thay đổi
  useEffect(() => { if (open) fetchDetail(); }, [open, fetchDetail]);

  const MB = detail ? METHOD_BADGE[detail.method] : null;
  const fmtOrderId = (id) => `ORD-${String(id).padStart(6, "0")}`;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480 } }}>
      <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptLongOutlinedIcon /><Typography variant="h6">Chi tiết đơn hàng</Typography>
        </Stack>

        {loading && <LinearProgress />}

        {detail && (
          <>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* [FIX] Dùng fullName và phone từ DTO */}
                <Avatar src={detail.user?.avatar} />
                <Box>
                  <Typography fontWeight={700}>{detail.user?.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail.user?.email} • {detail.user?.phone}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                <Chip color={STATUS_COLOR[detail.status] || "default"} label={detail.status} size="small" />
                <Chip icon={MB ? <MB.Icon fontSize="small" /> : null} label={MB?.label || detail.method} size="small" variant="outlined" />
                {/* [FIX] Dùng primaryItem.listingType */}
                <Chip icon={<LocalOfferOutlinedIcon />} label={detail.primaryItem?.listingType || 'N/A'} size="small" variant="outlined" />
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                {/* [FIX] Dùng orderId */}
                <InfoBlock label="Mã đơn" value={fmtOrderId(detail.orderId)} /> 
                {/* [FIX] Dùng total */}
                <InfoBlock label="Số tiền" value={fmtVND(detail.total)} /> 
                <InfoBlock label="Tạo lúc" value={fmtDateOrder(detail.createdAt)} />
                <InfoBlock label="Cập nhật" value={fmtDateOrder(detail.updatedAt)} />
              </Stack>

              {/* [FIX] meta không tồn tại trong DTO chi tiết, nên xóa hoặc tìm cách khác */}
              {/* {detail.meta?.address && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">{detail.meta.address}</Typography>
                </Box>
              )} */}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Sản phẩm/ Dịch vụ</Typography>
              <List dense>
                {/* [FIX] items hiện đã nằm trong DTO chi tiết (OrderDTO), không phải AdminOrderListDTO */}
                {detail.items?.map((it, idx) => (
                  <ListItem key={idx} disableGutters>
                    <ListItemIcon><DoneAllOutlinedIcon /></ListItemIcon>
                    {/* [FIX] sku/price: Nếu OrderItemDTO chỉ có title/qty/lineTotal, cần đảm bảo fmtVND không lỗi */}
                    <ListItemText primary={`${it.title} × ${it.qty}`} secondary={`${it.itemType || 'N/A'} • ${fmtVND(it.unitPrice)}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, overflow: "auto" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Tiến trình</Typography>
              <List dense>
                {/* [FIX] timeline: Giả định OrderDTO chi tiết có trường timeline */}
                {detail.timeline?.map((t) => (
                  <ListItem key={t.key || t.label} disableGutters sx={{ alignItems: "flex-start" }}>
                    <ListItemIcon><PendingActionsOutlinedIcon /></ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>{t.label}</Typography>
                          <Chip variant="outlined" size="small" label={fmtDateOrder(t.time)} />
                        </Stack>
                      }
                      secondary={t.desc}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Stack direction="row" spacing={1}>
              {/* NÚT 1: CHỈ HIỆN KHI CHƯA THANH TOÁN */}
              {["UNPAID", "PENDING_PAYMENT"].includes(detail.status) && (
                  <Button
                      fullWidth variant="contained" color="success" startIcon={<CheckCircleOutlineOutlinedIcon />}
                      onClick={async () => {
                          try { 
                              await adminOrdersApi.markPaid(detail.orderId); 
                              message.success("Đã đánh dấu đã thanh toán."); 
                              onClose(true); 
                          } catch (e) { 
                              console.error(e);
                              message.error("Không thực hiện được."); 
                          }
                      }}
                  >
                      Đánh dấu đã thanh toán
                  </Button>
              )}

              {/* NÚT 2: (BỔ SUNG) CHỈ HIỆN KHI ĐÃ THANH TOÁN/ĐANG XỬ LÝ */}
              {["PAID", "PROCESSING"].includes(detail.status) && (
                  <Button
                      fullWidth variant="contained" color="warning" startIcon={<AutorenewOutlinedIcon />}
                      onClick={async () => {
                          try { 
                              await adminOrdersApi.refund(detail.orderId); 
                              message.success("Đã hoàn tiền đơn hàng."); 
                              onClose(); 
                          } catch (e) { 
                              console.error(e);
                              message.error("Không thực hiện được."); 
                          }
                      }}
                  >
                      Hoàn tiền
                  </Button>
              )}

              {/* NÚT 3: CHỈ HIỆN KHI CHƯA BỊ HỦY/HOÀN TIỀN */}
              {detail.status !== "CANCELED" && detail.status !== "REFUNDED" && (
                  <Button
                      fullWidth variant="outlined" color="error" startIcon={<CancelOutlinedIcon />}
                      onClick={async () => {
                          try { 
                              await adminOrdersApi.cancel(detail.orderId); 
                              message.success("Đã hủy đơn."); 
                              onClose(); 
                          } catch (e) { 
                              console.error(e);
                              message.error("Không thực hiện được."); 
                          }
                      }}
                  >
                      Hủy đơn
                  </Button>
              )}
          </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}
