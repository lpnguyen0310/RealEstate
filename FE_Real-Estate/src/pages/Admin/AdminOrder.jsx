// src/pages/admin/orders/AdminOrder.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, Paper, Button } from "@mui/material";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import {
    fetchAdminOrders,
    setFilter,
    setPage,
    setSelectedIds,
    fetchOrderStats,
} from "@/store/adminOrderSlice";
import { adminOrdersApi } from "@/api/adminApi/adminOrdersApi";

import {
    FiltersBar,
    OrdersTable,
    OrderDetailDrawer,
    StatCards,
} from "@/components/admidashboard/order";

// Dùng lại ConfirmDialog như bên Post
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function AdminOrder() {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        rows,
        total,
        loading,
        selectedIds,
        filters: { q, status, method, sort },
        pagination: { page, pageSize },
        stats,
    } = useSelector((state) => state.adminOrder);

    const [detailOpen, setDetailOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    // ========= Confirm Dialog (nhất quán như Post) =========
    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        content: "",
        confirmText: "Xác nhận",
        loading: false,
        onConfirm: null,
    });

    const openConfirm = useCallback((cfg) => {
        setConfirm({
            open: true,
            title: cfg.title || "Xác nhận",
            content: cfg.content || "",
            confirmText: cfg.confirmText || "Xác nhận",
            loading: false,
            onConfirm: cfg.onConfirm || null,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirm((s) => ({ ...s, open: false, loading: false, onConfirm: null }));
    }, []);

    const runConfirm = useCallback(async () => {
        if (!confirm.onConfirm) return;
        try {
            setConfirm((s) => ({ ...s, loading: true }));
            await confirm.onConfirm();
        } finally {
            closeConfirm();
        }
    }, [confirm.onConfirm, closeConfirm]);

    // ========= Helpers =========
    const fetchData = useCallback(() => {
        dispatch(fetchAdminOrders());
        dispatch(fetchOrderStats());
    }, [dispatch]);

    const handleCloseDrawer = (refresh = false) => {
        setDetailOpen(false);
        if (refresh === true) fetchData();
    };

    // ========= URL -> STORE (hydrate) =========
    useEffect(() => {
        const qp = Object.fromEntries(searchParams.entries());

        // page / size
        const urlPage = Math.max(1, parseInt(qp.page || "1", 10) || 1);
        const urlSize = Math.max(1, parseInt(qp.size || "10", 10) || 10);

        if (page !== urlPage) dispatch(setPage(urlPage));
        if (pageSize !== urlSize) dispatch(setPageSize(urlSize));

        // q / status / method / sort
        const nextFilters = {
            q: qp.q || "",
            status: qp.status || "",
            method: qp.method || "",
            sort: qp.sort || "",
        };

        // Chỉ dispatch khi khác để tránh loop
        if (
            nextFilters.q !== (q || "") ||
            nextFilters.status !== (status || "") ||
            nextFilters.method !== (method || "") ||
            nextFilters.sort !== (sort || "")
        ) {
            dispatch(setFilter(nextFilters));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, dispatch]);

    // ========= STORE -> URL (debounced) =========
    useEffect(() => {
        const t = setTimeout(() => {
            const qp = new URLSearchParams();

            if (q && q.trim()) qp.set("q", q.trim());
            if (status && status.trim()) qp.set("status", status.trim());
            if (method && method.trim()) qp.set("method", method.trim());
            if (sort && sort.trim()) qp.set("sort", sort.trim());

            qp.set("page", String(page || 1));
            qp.set("size", String(pageSize || 10));

            const current = searchParams.toString();
            const next = qp.toString();
            if (current !== next) setSearchParams(qp);
        }, 250);

        return () => clearTimeout(t);
    }, [q, status, method, sort, page, pageSize, searchParams, setSearchParams]);

    // ========= FETCH LIST (debounce) =========
    useEffect(() => {
        const t = setTimeout(() => {
            fetchData();
        }, 250);
        return () => clearTimeout(t);
    }, [q, status, method, sort, page, pageSize, fetchData]);

    // ========= Realtime WS =========
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("/ws"),
            reconnectDelay: 3000,
            onConnect: () => {
                client.subscribe("/topic/admin/orders", async (msg) => {
                    try {
                        JSON.parse(msg.body);
                        await dispatch(fetchOrderStats());
                        await dispatch(fetchAdminOrders());
                    } catch (e) {
                        console.warn("Invalid WS payload:", e);
                    }
                });
            },
        });
        client.activate();
        return () => client.deactivate();
    }, [dispatch]);

    // ========= Handlers =========
    const handleSetFilter = (newFilters) => {
        // như Post: mọi thay đổi filter đưa page về 1
        if (page !== 1) dispatch(setPage(1));
        dispatch(setFilter(newFilters));
    };

    const handleSearch = () => {
        if (page !== 1) dispatch(setPage(1));
        fetchData();
    };

    const handlePageChange = (newPage) => dispatch(setPage(newPage));
    const handleSetPageSize = (ps) => {
        if (page !== 1) dispatch(setPage(1));
        dispatch(setPageSize(ps));
    };

    const handleView = (row) => {
        setCurrentOrderId(row.orderId);
        setDetailOpen(true);
    };

    const handleQuickAction = async (type, row) => {
        if (!row || !row.orderId) return message.error("Lỗi: Không tìm thấy ID đơn hàng.");
        const orderId = row.orderId;

        const labelMap = {
            paid: "Đánh dấu đã thanh toán",
            cancel: "Hủy đơn",
            refund: "Hoàn tiền",
        };

        openConfirm({
            title: `${labelMap[type]} #${orderId}`,
            content:
                type === "paid"
                    ? `Xác nhận đánh dấu đơn #${orderId} là đã thanh toán?`
                    : type === "cancel"
                        ? `Xác nhận hủy đơn #${orderId}?`
                        : `Xác nhận hoàn tiền đơn #${orderId}?`,
            confirmText: "Xác nhận",
            onConfirm: async () => {
                if (type === "paid") await adminOrdersApi.markPaid(orderId);
                if (type === "cancel") await adminOrdersApi.cancel(orderId);
                if (type === "refund") await adminOrdersApi.refund(orderId);
                fetchData();
            },
        });
    };

    const bulkAction = async (type) => {
        if (selectedIds.length === 0) return message.info("Chưa chọn đơn nào.");
        if (selectedIds.some((id) => !id || isNaN(Number(id)))) {
            return message.error("Lỗi: Một số ID đơn hàng không hợp lệ.");
        }

        const titleMap = {
            paid: "Đánh dấu đã thanh toán (nhiều)",
            refund: "Hoàn tiền (nhiều)",
            cancel: "Hủy đơn (nhiều)",
        };

        openConfirm({
            title: titleMap[type],
            content: `Áp dụng cho ${selectedIds.length} đơn: [${selectedIds.join(", ")}]. Hành động không thể hoàn tác.`,
            confirmText: "Thực hiện",
            onConfirm: async () => {
                await adminOrdersApi.bulk(selectedIds, type);
                dispatch(setSelectedIds([]));
                fetchData();
            },
        });
    };

    // ========= Bulk states (giữ logic cũ) =========
    const bulkActionStates = useMemo(() => {
        const selectedRows = rows.filter((row) => selectedIds.includes(row.orderId));
        const count = selectedRows.length;
        if (count === 0) return { canMarkPaid: false, canRefund: false, canCancel: false };

        const canMarkPaid = selectedRows.every((row) =>
            ["UNPAID", "PENDING_PAYMENT"].includes(row.status)
        );
        const canRefund = selectedRows.every((row) => ["PAID", "PROCESSING"].includes(row.status));
        const canCancel = selectedRows.every(
            (row) => row.status !== "CANCELED" && row.status !== "REFUNDED"
        );
        return { canMarkPaid, canRefund, canCancel };
    }, [selectedIds, rows]);

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                bgcolor: "#f8f9fc",
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 1440 }}>
                {/* KPIs */}
                <StatCards stats={stats} />

                {/* Filters (đưa page về 1 khi đổi) */}
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

                {/* Bulk actions */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.25, sm: 1.5 },
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        mb: { xs: 0.5, sm: 1 },
                    }}
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                    >
                        <Typography variant="body2" color="text.secondary">
                            Đã chọn <b>{selectedIds.length}</b> đơn
                        </Typography>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => bulkAction("paid")}
                                disabled={!bulkActionStates.canMarkPaid}
                                sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                                Đánh dấu đã thanh toán
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => bulkAction("refund")}
                                disabled={!bulkActionStates.canRefund}
                                sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                                Hoàn tiền
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => bulkAction("cancel")}
                                disabled={!bulkActionStates.canCancel}
                                sx={{ width: { xs: "100%", sm: "auto" } }}
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
                    onPageChange={handlePageChange}
                    selected={selectedIds}
                    setSelected={(ids) => dispatch(setSelectedIds(ids))}
                    onView={handleView}
                    onQuickAction={handleQuickAction}
                    setPageSize={handleSetPageSize}
                />

                {/* Drawer */}
                <OrderDetailDrawer open={detailOpen} onClose={handleCloseDrawer} orderId={currentOrderId} />
            </Box>

            {/* Confirm chung */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                content={confirm.content}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onClose={closeConfirm}
                onConfirm={runConfirm}
            />
        </Box>
    );
}
