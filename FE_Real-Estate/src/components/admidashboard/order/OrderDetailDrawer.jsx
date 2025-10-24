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
import { message } from "antd";
import { STATUS_COLOR, METHOD_BADGE } from "./constants";
import { fmtDateOrder, fmtVND } from "@/utils/validators";
import { adminOrdersApi } from "../../../api/adminApi/adminOrdersMock";

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
    if (!orderId) return;
    setLoading(true);
    try { setDetail(await adminOrdersApi.getById(orderId)); }
    catch { message.error("Không tải được chi tiết đơn hàng."); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { if (open) fetchDetail(); }, [open, fetchDetail]);

  const MB = detail ? METHOD_BADGE[detail.method] : null;

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
                <Avatar src={detail.user?.avatar} />
                <Box>
                  <Typography fontWeight={700}>{detail.user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail.user?.email} • {detail.user?.phone}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                <Chip color={STATUS_COLOR[detail.status] || "default"} label={detail.status} size="small" />
                <Chip icon={MB ? <MB.Icon fontSize="small" /> : null} label={MB?.label || detail.method} size="small" variant="outlined" />
                <Chip icon={<LocalOfferOutlinedIcon />} label={detail.meta?.listingType} size="small" variant="outlined" />
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                <InfoBlock label="Mã đơn" value={detail.id} />
                <InfoBlock label="Số tiền" value={fmtVND(detail.amount)} />
                <InfoBlock label="Tạo lúc" value={fmtDateOrder(detail.createdAt)} />
                <InfoBlock label="Cập nhật" value={fmtDateOrder(detail.updatedAt)} />
              </Stack>

              {detail.meta?.address && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">{detail.meta.address}</Typography>
                </Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Sản phẩm/ Dịch vụ</Typography>
              <List dense>
                {detail.items?.map((it, idx) => (
                  <ListItem key={idx} disableGutters>
                    <ListItemIcon><DoneAllOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={`${it.name} × ${it.qty}`} secondary={`${it.sku} • ${fmtVND(it.price)}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, overflow: "auto" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Tiến trình</Typography>
              <List dense>
                {detail.timeline?.map((t) => (
                  <ListItem key={t.key} disableGutters sx={{ alignItems: "flex-start" }}>
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
              <Button
                fullWidth variant="contained" color="success" startIcon={<CheckCircleOutlineOutlinedIcon />}
                onClick={async () => {
                  try { await adminOrdersApi.markPaid(detail.id); message.success("Đã đánh dấu đã thanh toán."); onClose(); }
                  catch { message.error("Không thực hiện được."); }
                }}
              >
                Đánh dấu đã thanh toán
              </Button>
              <Button
                fullWidth variant="outlined" color="error" startIcon={<CancelOutlinedIcon />}
                onClick={async () => {
                  try { await adminOrdersApi.cancel(detail.id); message.success("Đã hủy đơn."); onClose(); }
                  catch { message.error("Không thực hiện được."); }
                }}
              >
                Hủy đơn
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}
