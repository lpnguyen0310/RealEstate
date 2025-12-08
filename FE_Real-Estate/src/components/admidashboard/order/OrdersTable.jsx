import React, { useMemo, useState } from "react";
import {
    Paper, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Checkbox, Stack, Box, Avatar, Badge, Chip, Tooltip, IconButton,
    Pagination, PaginationItem, Typography, Select, MenuItem, Menu, ListItemIcon, ListItemText,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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
    setPageSize,
}) {
    const allChecked = rows.length > 0 && selected.length === rows.length;
    const indeterminate = selected.length > 0 && selected.length < rows.length;

    const toggleAll = (e) => {
        e.stopPropagation();
        if (e.target.checked) setSelected(rows.map((r) => r.orderId));
        else setSelected([]);
    };
    const toggleOne = (e, id) => {
        e.stopPropagation();
        const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
        setSelected(next);
    };

    const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = total === 0 ? 0 : Math.min(total, start + rows.length - 1);

    const fmtOrderId = (id) => `ORD-${String(id).padStart(6, "0")}`;

    // Mobile menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const openMenu = Boolean(anchorEl);
    const openMenuFor = (e, row) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setMenuRow(row);
    };
    const closeMenu = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };
    const runAndClose = (fn) => {
        if (!menuRow) return;
        fn(menuRow);
        closeMenu();
    };

    // Shadow khi header sticky cuộn (nhẹ thôi, không bắt buộc)
    const [scrolled, setScrolled] = useState(false);
    const onScroll = (e) => setScrolled(e.currentTarget.scrollTop > 0);

    const REFUND_WINDOW_DAYS = 2;
    const canRefund = (order) => {
        // 1. Phải là trạng thái đã thanh toán
        if (!["PAID", "PROCESSING"].includes(order.status)) return false;

        // 2. Kiểm tra thời gian
        if (!order.createdAt) return false;
        
        const createdDate = new Date(order.createdAt);
        const currentDate = new Date();
        
        // Tính khoảng cách thời gian (miliseconds)
        const diffTime = Math.abs(currentDate - createdDate);
        // Quy đổi ra ngày
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return diffDays <= REFUND_WINDOW_DAYS;
    };

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
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <TableContainer
                    onScroll={onScroll}
                    sx={{
                        borderRadius: "10px",
                        overflow: "auto",
                        border: "1px solid #eef2f9",
                        maxWidth: "100%",
                    }}
                >
                    <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
                        <TableHead
                            sx={{
                                backgroundColor: "#f3f7ff",
                                "& .MuiTableCell-root": {
                                    position: "sticky",
                                    top: 0,
                                    background: "#f3f7ff",
                                    zIndex: 1,
                                    boxShadow: scrolled ? "inset 0 -1px 0 #e5e7eb, 0 2px 6px rgba(0,0,0,0.06)" : "inset 0 -1px 0 #e5e7eb",
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell padding="checkbox" sx={styles.headCell}>
                                    <Checkbox checked={allChecked} indeterminate={indeterminate} onChange={toggleAll} />
                                </TableCell>
                                <TableCell sx={styles.headCell}>Mã đơn</TableCell>
                                <TableCell sx={styles.headCell}>Khách hàng</TableCell>

                                <TableCell sx={{ ...styles.headCell, display: { xs: "none", sm: "table-cell" } }}>
                                    Phương thức
                                </TableCell>

                                <TableCell sx={{ ...styles.headCell, textAlign: "right" }}>Số tiền</TableCell>

                                <TableCell sx={styles.headCell}>Trạng thái</TableCell>

                                <TableCell sx={{ ...styles.headCell, display: { xs: "none", md: "table-cell" } }}>
                                    Tạo lúc
                                </TableCell>

                                <TableCell sx={{ ...styles.headCell, display: { xs: "none", lg: "table-cell" } }}>
                                    Cập nhật
                                </TableCell>

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
                                    const MB = METHOD_BADGE[r.method];
                                    const primaryItem = r.primaryItem;

                                    return (
                                        <TableRow
                                            key={r.orderId}
                                            hover
                                            sx={{
                                                "& td": { transition: "background-color 140ms ease", py: { xs: 1, sm: 1.25 } },
                                                "&:hover td": { backgroundColor: HOVER_BG },
                                                cursor: "pointer",
                                            }}
                                            onClick={() => onView(r)}
                                        >
                                            <TableCell padding="checkbox" sx={styles.bodyCell}>
                                                <Checkbox
                                                    checked={selected.includes(r.orderId)}
                                                    onChange={(e) => toggleOne(e, r.orderId)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>

                                            {/* Mã đơn */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1.25} alignItems="center">
                                                    <Badge
                                                        color="primary"
                                                        badgeContent={r.itemsCount}
                                                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                                    >
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#eef2ff", color: "#4f46e5" }}>
                                                            <ReceiptLongOutlinedIcon fontSize="small" />
                                                        </Avatar>
                                                    </Badge>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography fontWeight={700} >
                                                            {fmtOrderId(r.orderId)}
                                                        </Typography>
                                                        <Typography
                                                            fontSize={12}
                                                            color="#718198"
                                                            sx={{
                                                                overflow: "hidden",
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: "vertical",
                                                            }}
                                                        >
                                                            {primaryItem?.title}
                                                        </Typography>

                                                        {/* Mobile meta line: xs only */}
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.75}
                                                            alignItems="center"
                                                            sx={{ display: { xs: "flex", sm: "none" }, mt: 0.25, flexWrap: "wrap" }}
                                                        >
                                                            {MB && (
                                                                <Chip
                                                                    size="small"
                                                                    variant="outlined"
                                                                    icon={<MB.Icon fontSize="small" />}
                                                                    label={MB.label}
                                                                    sx={{ height: 22 }}
                                                                />
                                                            )}
                                                            <Chip
                                                                size="small"
                                                                color={STATUS_COLOR[r.status] || "default"}
                                                                label={r.status}
                                                                sx={{ height: 22 }}
                                                            />
                                                            <Typography variant="caption" color="#718198">
                                                                • {fmtDateOrder(r.createdAt)}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* Khách hàng */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar src={r.user?.avatar} sx={{ width: 28, height: 28 }} />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography fontWeight={600} >
                                                            {r.user?.fullName}
                                                        </Typography>
                                                        <Typography fontSize={12} color="#718198" >
                                                            {r.user?.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* Phương thức (ẩn ở xs) */}
                                            <TableCell sx={{ ...styles.bodyCell, display: { xs: "none", sm: "table-cell" } }}>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    icon={MB ? <MB.Icon fontSize="small" /> : null}
                                                    label={MB?.label || r.method}
                                                />
                                            </TableCell>

                                            {/* Số tiền */}
                                            <TableCell sx={{ ...styles.bodyCell, textAlign: "right", fontWeight: 700 }}>
                                                {fmtVND(r.total)}
                                            </TableCell>

                                            {/* Trạng thái */}
                                            <TableCell sx={styles.bodyCell}>
                                                <Chip size="small" color={STATUS_COLOR[r.status] || "default"} label={r.status} />
                                            </TableCell>

                                            {/* Tạo lúc */}
                                            <TableCell sx={{ ...styles.bodyCell, display: { xs: "none", md: "table-cell" } }}>
                                                {fmtDateOrder(r.createdAt)}
                                            </TableCell>

                                            {/* Cập nhật */}
                                            <TableCell sx={{ ...styles.bodyCell, display: { xs: "none", lg: "table-cell" } }}>
                                                {fmtDateOrder(r.updatedAt)}
                                            </TableCell>

                                            {/* Hành động */}
                                            <TableCell align="center" sx={{ ...styles.bodyCell }}>
                                                {/* Desktop ≥ md: nút trực tiếp */}
                                                <Box sx={{ display: { xs: "none", md: "inline-flex" }, gap: 0.5 }}>
                                                    <Tooltip title="Xem chi tiết">
                                                        <IconButton onClick={(e) => { e.stopPropagation(); onView(r); }} size="small">
                                                            <InfoOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {["UNPAID", "PENDING_PAYMENT"].includes(r.status) && (
                                                        <Tooltip title="Đánh dấu đã thanh toán">
                                                            <IconButton
                                                                onClick={(e) => { e.stopPropagation(); onQuickAction("paid", r); }}
                                                                color="success"
                                                                size="small"
                                                            >
                                                                <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {/* Thay đoạn điều kiện cũ bằng hàm canRefund */}
                                                    {canRefund(r) && (
                                                        <Tooltip title={`Hoàn tiền (Còn hạn ${REFUND_WINDOW_DAYS} ngày)`}>
                                                            <IconButton
                                                                onClick={(e) => { e.stopPropagation(); onQuickAction("refund", r); }}
                                                                color="warning"
                                                                size="small"
                                                            >
                                                                <AutorenewOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {r.status !== "CANCELED" && r.status !== "REFUNDED" && (
                                                        <Tooltip title="Hủy đơn">
                                                            <IconButton
                                                                onClick={(e) => { e.stopPropagation(); onQuickAction("cancel", r); }}
                                                                color="error"
                                                                size="small"
                                                            >
                                                                <CancelOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>

                                                {/* Mobile/Tablet < md: gom menu */}
                                                <Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
                                                    <IconButton size="small" onClick={(e) => openMenuFor(e, r)}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer */}
                <Box
                    sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {setPageSize && (
                            <Select
                                size="small"
                                value={pageSize}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setPageSize(v);
                                    onPageChange(1);
                                }}
                                sx={{
                                    height: 40,
                                    minWidth: { xs: 96, sm: 110 },
                                    borderRadius: "8px",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7deec" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3059ff" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#3059ff",
                                        borderWidth: 1.4,
                                    },
                                }}
                            >
                                {[10, 20, 50].map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
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

            {/* Mobile actions menu */}
            <Menu anchorEl={anchorEl} open={openMenu} onClose={closeMenu}>
                <MenuItem onClick={() => runAndClose((r) => onView(r))}>
                    <ListItemIcon>
                        <InfoOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Chi tiết</ListItemText>
                </MenuItem>

                {["UNPAID", "PENDING_PAYMENT"].includes(menuRow?.status || "") && (
                    <MenuItem onClick={() => runAndClose((r) => onQuickAction("paid", r))}>
                        <ListItemIcon>
                            <CheckCircleOutlineOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Đánh dấu đã thanh toán</ListItemText>
                    </MenuItem>
                )}

                {["PAID", "PROCESSING"].includes(menuRow?.status || "") && (
                    <MenuItem onClick={() => runAndClose((r) => onQuickAction("refund", r))}>
                        <ListItemIcon>
                            <AutorenewOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Hoàn tiền</ListItemText>
                    </MenuItem>
                )}

                {menuRow && menuRow.status !== "CANCELED" && menuRow.status !== "REFUNDED" && (
                    <MenuItem onClick={() => runAndClose((r) => onQuickAction("cancel", r))}>
                        <ListItemIcon>
                            <CancelOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Hủy đơn</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Paper>
    );
}
