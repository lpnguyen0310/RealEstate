import React, { useCallback, useEffect, useMemo, useState } from "react"; // Đảm bảo useMemo được import
import { Box, Stack, Typography, Paper, Button, Tooltip } from "@mui/material";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { message } from "antd";
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchAdminOrders, setFilter, setPage, setSelectedIds, fetchOrderStats } from "@/store/adminOrderSlice";
import { adminOrdersApi } from "@/api/adminApi/adminOrdersApi"; // Sử dụng API thực

import { FiltersBar, OrdersTable, OrderDetailDrawer, StatCards, ORDER_ACTIONS_HINT } from "../../components/admidashboard/order";

export default function AdminOrder() {
    const dispatch = useDispatch();
    // --- 1. Lấy trạng thái từ Redux Store ---
    const { 
        rows, 
        total, loading, 
        selectedIds, 
        filters: { q, status, method, sort, range },
        pagination: { page, pageSize },
        stats 
    } = useSelector(state => state.adminOrder); 

    // --- 2. State local (Không liên quan đến Redux) ---
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    // --- 4. Tương tác Lấy Dữ liệu (Dùng Thunk) ---
    const fetchData = useCallback(() => {
        dispatch(fetchAdminOrders());
        dispatch(fetchOrderStats()); 
    }, [dispatch]); 

    const handleCloseDrawer = (refresh = false) => {
        setDetailOpen(false); 
        if (refresh === true) {
            fetchData(); 
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); 

        return () => {
            clearTimeout(timer);
        };
    }, [q, status, method, sort, page, pageSize, range, fetchData]); 

    // a. Thay đổi Filter và Search
    const handleSetFilter = (newFilters) => {
        dispatch(setFilter(newFilters));
    };

    const handleSearch = () => { 
        fetchData(); 
    };

    // b. Thay đổi Page
    const handlePageChange = (newPage) => {
        dispatch(setPage(newPage));
    };

    // c. Xem chi tiết
    const handleView = (row) => { 
        setCurrentOrderId(row.orderId); 
        setDetailOpen(true); 
    };

    const handleQuickAction = async (type, row) => {
        if (!row || !row.orderId) { 
            return message.error("Lỗi: Không tìm thấy ID đơn hàng.");
        }
        const orderId = row.orderId;

        try {
            if (type === "paid") await adminOrdersApi.markPaid(orderId);
            if (type === "cancel") await adminOrdersApi.cancel(orderId);
            if (type === "refund") await adminOrdersApi.refund(orderId);
            fetchData();
        } catch { 
            // Lỗi đã được xử lý
        }
    };

    // e. Bulk Action
    const bulkAction = async (type) => {
        if (selectedIds.length === 0) return message.info("Chưa chọn đơn nào.");
        if (selectedIds.some(id => !id || isNaN(Number(id)))) {
            return message.error("Lỗi: Một số ID đơn hàng không hợp lệ.");
        }
        try {
            await adminOrdersApi.bulk(selectedIds, type);
            dispatch(setSelectedIds([])); 
            fetchData();
        } catch { 
            // Lỗi đã được xử lý
        }
    };

    // ===== SỬA LẠI LOGIC VALIDATION (Bỏ 'show') =====
    const bulkActionStates = useMemo(() => {
        const selectedRows = rows.filter(row => selectedIds.includes(row.orderId));
        const count = selectedRows.length;

        if (count === 0) {
            // Vô hiệu hóa tất cả nếu không có gì được chọn
            return { canMarkPaid: false, canRefund: false, canCancel: false };
        }

        // Tính toán logic cho từng nút
        const canMarkPaid = selectedRows.every(
            row => ["UNPAID", "PENDING_PAYMENT"].includes(row.status)
        );
        
        const canRefund = selectedRows.every(
            row => ["PAID", "PROCESSING"].includes(row.status)
        );
        
        const canCancel = selectedRows.every(
            row => row.status !== "CANCELED" && row.status !== "REFUNDED"
        );

        return { canMarkPaid, canRefund, canCancel };

    }, [selectedIds, rows]); // Chạy lại khi danh sách chọn hoặc dữ liệu bảng thay đổi
    // ==================================================

    return (
        <Box sx={{ display: "grid", gap: 1}}>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
                <select
                    value={range || 'today'} // (Giữ nguyên hoặc thêm '|| today' cho an toàn)
                    onChange={(e) => dispatch(setFilter({ range: e.target.value }))} // <-- SỬA DÒNG NÀY
                    className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-inset transition"
                >
                    <option value="today">Hôm nay</option>
                    <option value="last_7d">7 ngày qua</option>
                    <option value="last_30d">30 ngày qua</option>
                    <option value="this_month">Tháng này</option>
                </select>
            </div>

            {/* KPIs */}
            <StatCards stats={stats} />

            {/* Filters */}
            <FiltersBar
                q={q} 
                setQ={(val) => handleSetFilter({ q: val })}
                status={status} 
                setStatus={(val) => handleSetFilter({ status: val })}
                method={method} 
                setMethod={(val) => handleSetFilter({ method: val })}
                sort={sort} 
                setSort={(val) => handleSetFilter({ sort: val })}
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Bulk actions (Luôn hiển thị Paper) */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px dashed", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Đã chọn <b>{selectedIds.length}</b> đơn</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button 
                            size="small" 
                            variant="contained" 
                            color="success" 
                            onClick={() => bulkAction("paid")}
                            disabled={!bulkActionStates.canMarkPaid}
                        >
                            Đánh dấu đã thanh toán
                        </Button>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            color="warning" 
                            onClick={() => bulkAction("refund")}
                            disabled={!bulkActionStates.canRefund}
                        >
                            Hoàn tiền
                        </Button>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            color="error" 
                            onClick={() => bulkAction("cancel")}
                            disabled={!bulkActionStates.canCancel}
                        >
                            Hủy đơn
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Table */}
            <OrdersTable
                rows={rows} 
                loading={loading}
                page={page} 
                pageSize={pageSize} 
                total={total}
                onPageChange={handlePageChange} // Dispatch setPage
                selected={selectedIds} 
                setSelected={(ids) => dispatch(setSelectedIds(ids))} // Dispatch setSelectedIds
                onView={handleView} 
                onQuickAction={handleQuickAction}
            />

            {/* Drawer */}
            <OrderDetailDrawer open={detailOpen} onClose={handleCloseDrawer} orderId={currentOrderId} />
        </Box>
    );
}