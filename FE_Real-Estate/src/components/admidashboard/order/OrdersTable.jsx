import React from "react";
import {
    Paper, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Stack, Box, Avatar, Badge, Chip, Tooltip, IconButton,
    Pagination, PaginationItem, Typography, Select, MenuItem,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { STATUS_COLOR, METHOD_BADGE, HOVER_BG, styles } from "./constants";
import { fmtDateOrder, fmtVND } from "@/utils/validators";

export default function OrdersTable({
    rows,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    selected,
    setSelected,
    onView,
    onQuickAction,
    // optional – nếu truyền thì sẽ hiện dropdown chọn page size
    setPageSize,
}) {
    const allChecked = rows.length > 0 && selected.length === rows.length;
    const indeterminate = selected.length > 0 && selected.length < rows.length;

    const toggleAll = (e) => { if (e.target.checked) setSelected(rows.map((r) => r.orderId)); else setSelected([]); };
    // Sửa toggleOne để sử dụng r.orderId
    const toggleOne = (id) => {
        // 'selected' là mảng IDs được truyền từ component cha (AdminOrder)
        const newSelected = selected.includes(id)
            ? selected.filter((x) => x !== id)  // Tạo mảng mới loại bỏ 'id'
            : [...selected, id];                // Tạo mảng mới thêm 'id'

        // Gửi mảng mới này về cho Redux
        setSelected(newSelected);
    };

    const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = total === 0 ? 0 : Math.min(total, start + rows.length - 1);

    // Hàm format ID để khớp với format cũ (ORD-000059)
    const fmtOrderId = (id) => `ORD-${String(id).padStart(6, "0")}`;

    return (
        <Paper
            elevation={0}
            sx={{
                backgroundColor: "#fff",
                borderRadius: "14px",
                border: "1px solid #e8edf6",
                boxShadow: "0 6px 18px rgba(13,47,97,0.06)",
                mt: 2,
            }}
        >
            {loading && <LinearProgress />}
            <Box sx={{ p: 2 }}>
                <TableContainer
                    sx={{
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid #eef2f9",
                    }}
                >
                    <Table>
                        <TableHead sx={{ backgroundColor: "#f3f7ff" }}>
                            <TableRow>
                                <TableCell padding="checkbox" sx={styles.headCell}>
                                    <Checkbox
                                        checked={allChecked}
                                        indeterminate={indeterminate}
                                        onChange={toggleAll}
                                    />
                                </TableCell>
                                <TableCell sx={styles.headCell}>Mã đơn</TableCell>
                                <TableCell sx={styles.headCell}>Khách hàng</TableCell>
                                <TableCell sx={styles.headCell}>Phương thức</TableCell>
                                <TableCell sx={{ ...styles.headCell, textAlign: "right" }}>
                                    Số tiền
                                </TableCell>
                                <TableCell sx={styles.headCell}>Trạng thái</TableCell>
                                <TableCell sx={styles.headCell}>Tạo lúc</TableCell>
                                <TableCell sx={styles.headCell}>Cập nhật</TableCell>
                                <TableCell sx={{ ...styles.headCell, textAlign: "center" }} width={140}>
                                    Hành động
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "#7a8aa1", bgcolor: "#fff" }}>
                                        {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((r) => {
                                    // Dữ liệu từ BE: r.method (string), r.user (object), r.orderId (long), r.total (long)
                                    const MB = METHOD_BADGE[r.method];
                                    const primaryItem = r.primaryItem; // Lấy thông tin gói chính

                                    return (
                                        <TableRow
                                            key={r.orderId} // Dùng orderId làm key
                                            hover
                                            sx={{
                                                "& td": { transition: "background-color 140ms ease" },
                                                "&:hover td": { backgroundColor: HOVER_BG },
                                            }}
                                        >
                                            <TableCell padding="checkbox" sx={styles.bodyCell}>
                                                <Checkbox
                                                    checked={selected.includes(r.orderId)} // Dùng orderId
                                                    onChange={() => toggleOne(r.orderId)} // Dùng orderId
                                                />
                                            </TableCell>

                                            {/* CỘT MÃ ĐƠN */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Badge
                                                        color="primary"
                                                        badgeContent={r.itemsCount} // itemsCount đã có
                                                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                                    >
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#eef2ff", color: "#4f46e5" }}>
                                                            <ReceiptLongOutlinedIcon fontSize="small" />
                                                        </Avatar>
                                                    </Badge>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography fontWeight={700} noWrap>
                                                            {fmtOrderId(r.orderId)} {/* SỬA: Dùng orderId và format */}
                                                        </Typography>
                                                        <Typography fontSize={12} color="#718198">
                                                            {primaryItem?.title} {/* SỬA: Lấy tên gói hàng chính */}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* CỘT KHÁCH HÀNG */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar src={r.user?.avatar} sx={{ width: 28, height: 28 }} /> {/* Đã sửa Optional Chaining */}
                                                    <Box>
                                                        <Typography fontWeight={600}>{r.user?.fullName}</Typography> {/* Đã sửa Optional Chaining */}
                                                        <Typography fontSize={12} color="#718198">{r.user?.email}</Typography> {/* Đã sửa Optional Chaining */}
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* CỘT PHƯƠNG THỨC */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    icon={MB ? <MB.Icon fontSize="small" /> : null}
                                                    label={MB?.label || r.method} 
                                                />
                                            </TableCell>

                                            {/* CỘT SỐ TIỀN */}
                                            <TableCell sx={{ ...styles.bodyCell, textAlign: "right", fontWeight: 700 }}>
                                                {fmtVND(r.total)} {/* SỬA: Dùng r.total thay vì r.amount */}
                                            </TableCell>

                                            {/* CỘT TRẠNG THÁI */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Chip
                                                    size="small"
                                                    color={STATUS_COLOR[r.status] || "default"}
                                                    label={r.status}
                                                />
                                            </TableCell>

                                            {/* CỘT TẠO LÚC */}
                                            <TableCell sx={styles.bodyCell}>{fmtDateOrder(r.createdAt)}</TableCell>
                                            
                                            {/* CỘT CẬP NHẬT */}
                                            <TableCell sx={styles.bodyCell}>{fmtDateOrder(r.updatedAt)}</TableCell>

                                            {/* CỘT HÀNH ĐỘNG */}
                                            <TableCell align="center" sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Xem chi tiết">
                                                        <IconButton onClick={() => onView(r)} size="small">
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* QICK ACTION */}
                                                    {["UNPAID", "PENDING_PAYMENT"].includes(r.status) && ( // Thêm PENDING_PAYMENT
                                                        <Tooltip title="Đánh dấu đã thanh toán">
                                                            <IconButton onClick={() => onQuickAction("paid", r)} color="success" size="small">
                                                                <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {["PAID", "PROCESSING"].includes(r.status) && (
                                                        <Tooltip title="Hoàn tiền">
                                                            <IconButton onClick={() => onQuickAction("refund", r)} color="warning" size="small">
                                                                <AutorenewOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {/* Hủy đơn áp dụng cho hầu hết trạng thái trừ CANCELED/REFUNDED */}
                                                    {r.status !== "CANCELED" && r.status !== "REFUNDED" && (
                                                        <Tooltip title="Hủy đơn">
                                                            <IconButton onClick={() => onQuickAction("cancel", r)} color="error" size="small">
                                                                <CancelOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer giống bố cục mẫu */}
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {/* setPageSize không được truyền từ AdminOrder, nên phần này sẽ không được render */}
                        {setPageSize && (
                            <Select
                                size="small"
                                value={pageSize}
                                onChange={(e) => { const v = Number(e.target.value); setPageSize(v); onPageChange(1); }}
                                sx={{
                                    height: 40, minWidth: 100, borderRadius: "8px",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff", borderWidth: 1.4 },
                                }}
                            >
                                {[10, 20, 50].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                            </Select>
                        )}
                        <Typography fontSize={13} color="#7a8aa1">
                            Hiển thị {start} đến {end} của {total}
                        </Typography>
                    </Box>

                    <Pagination
                        page={page}
                        count={totalPages}
                        onChange={(_, p) => onPageChange(p)}
                        renderItem={(item) => (
                            <PaginationItem
                                {...item}
                                slots={{
                                    previous: () => <span style={{ padding: "0 10px" }}>Trước</span>,
                                    next: () => <span style={{ padding: "0 10px" }}>Tiếp Theo</span>,
                                }}
                                sx={{
                                    outline: "none",
                                    "&:focus": { outline: "none" },
                                    "&.Mui-focusVisible": { outline: "none", boxShadow: "none" },
                                    height: 40,
                                    minWidth: 40,
                                    px: 1.5,
                                    borderRadius: "12px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    "&.MuiPaginationItem-root": { border: "1px solid #e5e7eb" },
                                    "&.Mui-selected": {
                                        bgcolor: "#415a8c",
                                        color: "#fff",
                                        borderColor: "transparent",
                                        "&:hover": { bgcolor: "#415a8c" },
                                    },
                                    "&.MuiPaginationItem-previousNext": {
                                        bgcolor: "#e9eaee",
                                        color: "#6b7280",
                                        border: "none",
                                        "&:hover": { bgcolor: "#dfe2e8" },
                                        "&.Mui-disabled": { opacity: 0.6 },
                                    },
                                }}
                            />
                        )}
                    />
                </Box>
            </Box>
        </Paper>
    );
}
