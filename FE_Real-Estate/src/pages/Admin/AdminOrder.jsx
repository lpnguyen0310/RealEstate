import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, Paper, Button, Tooltip } from "@mui/material";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { message } from "antd";

import { FiltersBar, OrdersTable, OrderDetailDrawer, StatCards, ORDER_ACTIONS_HINT } from "../../components/admidashboard/order";
import { adminOrdersApi } from "../../api/adminApi/adminOrdersMock";

export default function AdminOrder() {
    // filters
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("ALL");
    const [method, setMethod] = useState("ALL");
    const [sort, setSort] = useState("createdAt,DESC");

    // table
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState([]);

    // drawer
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    const stats = useMemo(() => ({
        todayOrders: 23, todayRevenue: 12500000, avgTicket: 540000, processing: 12, pending: 7, todayPaid: 15,
    }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminOrdersApi.search({ q, status, method, sort, page, size: pageSize });
            setRows(data.content || []);
            setTotal(data.total || 0);
            setSelected([]);
        } catch {
            message.error("Không tải được danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    }, [q, status, method, sort, page, pageSize]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = () => { setPage(1); fetchData(); };
    const handleView = (row) => { setCurrentOrderId(row.id); setDetailOpen(true); };

    const handleQuickAction = async (type, row) => {
        try {
            if (type === "paid") await adminOrdersApi.markPaid(row.id);
            if (type === "cancel") await adminOrdersApi.cancel(row.id);
            if (type === "refund") await adminOrdersApi.refund(row.id);
            message.success("Đã thực hiện thao tác.");
            fetchData();
        } catch { message.error("Thao tác thất bại."); }
    };

    const bulkAction = async (type) => {
        if (selected.length === 0) return message.info("Chưa chọn đơn nào.");
        try {
            await adminOrdersApi.bulk(selected, type);
            message.success(`Đã thực hiện ${type} cho ${selected.length} đơn.`);
            fetchData();
        } catch { message.error("Bulk action thất bại."); }
    };

    return (
        <Box sx={{ display: "grid", gap: 2}}>
            {/* Header */}
        

            {/* KPIs */}
            <StatCards stats={stats} />

            {/* Filters */}
            <FiltersBar
                q={q} setQ={setQ}
                status={status} setStatus={setStatus}
                method={method} setMethod={setMethod}
                sort={sort} setSort={setSort}
                onSearch={handleSearch}
                loading={loading}
            />

            {/* Bulk actions */}
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px dashed", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Đã chọn <b>{selected.length}</b> đơn</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" color="success" onClick={() => bulkAction("paid")}>Đánh dấu đã thanh toán</Button>
                        <Button size="small" variant="outlined" color="warning" onClick={() => bulkAction("refund")}>Hoàn tiền</Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => bulkAction("cancel")}>Hủy đơn</Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Table */}
            <OrdersTable
                rows={rows} loading={loading}
                page={page} pageSize={pageSize} total={total}
                onPageChange={setPage}
                selected={selected} setSelected={setSelected}
                onView={handleView} onQuickAction={handleQuickAction}
            />

            {/* Drawer */}
            <OrderDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} orderId={currentOrderId} />
        </Box>
    );
}
