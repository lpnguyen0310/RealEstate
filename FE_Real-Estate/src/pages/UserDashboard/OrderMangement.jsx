// src/pages/Dashboard/OrderManagement.jsx
import { useState, useMemo, useCallback } from "react";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import {
    OrderSearchBar as TxSearchBar,
    OrderListTable as OrderTable,
    OrderStatusTabs as TxStatusTabs,
    OrderDetailModal
} from "@/components/dashboard/ordermanagement";
import { exportTransactionsXLSX } from "@/utils/exportXlsx";
import { ORDERS } from "@/data/Dashboard/OrderManagementData"; // 👈

const normalize = (s = "") =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const parseRowDate = (s) => {
    const d1 = dayjs(s, "DD/MM/YYYY HH:mm", true);
    if (d1.isValid()) return d1;
    return dayjs(s, "DD/MM/YYYY", true);
};

export default function OrderManagement() {
    const [orderCode, setOrderCode] = useState("");
    const [date, setDate] = useState(null);
    const [tabKey, setTabKey] = useState("all");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // đếm badge theo source ORDERS
    const counts = useMemo(() => ({
        all: ORDERS.length,
        success: ORDERS.filter((t) => t.status === "Thành công").length,
        processing: ORDERS.filter((t) => t.status === "Đang xử lý").length,
        canceled: ORDERS.filter((t) => t.status === "Đã hủy").length,
    }), []);

    // lọc theo tab + mã + ngày
    const filteredData = useMemo(() => {
        const q = normalize(orderCode);
        return ORDERS
            .filter((t) => {
                if (tabKey === "all") return true;
                if (tabKey === "success") return t.status === "Thành công";
                if (tabKey === "processing") return t.status === "Đang xử lý";
                if (tabKey === "canceled") return t.status === "Đã hủy";
                return true;
            })
            .filter((t) => (q ? normalize(t.code).includes(q) : true))
            .filter((t) => {
                if (!date) return true;
                const rowDay = parseRowDate(t.createdAt);
                return rowDay.isValid() && rowDay.isSame(date, "day");
            });
    }, [tabKey, orderCode, date]);

    const handleSearch = useCallback(() => setPage(1), []);
    const handleExport = () => {
        // export theo kết quả lọc hoặc toàn bộ tuỳ bạn
        exportTransactionsXLSX(filteredData, "giao_dich.xlsx");
    };

    // chi tiết đơn hàng
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const handleRowClick = (order) => {
        setSelectedOrder(order);
        setOpenModal(true);
    };

    return (
        <Stack spacing={2.5}>
            <TxSearchBar
                orderCode={orderCode}
                onOrderCodeChange={setOrderCode}
                date={date}
                onDateChange={(d) => { setDate(d); setPage(1); }}
                onSearch={handleSearch}
                onExport={handleExport}
            />

            <TxStatusTabs
                activeKey={tabKey}
                onChange={(k) => { setTabKey(k); setPage(1); }}
                counts={counts}
            />

            <OrderTable
                data={filteredData}
                page={page}
                pageSize={pageSize}
                totalItems={filteredData.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                onRowClick={handleRowClick}
            />

            <OrderDetailModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                order={selectedOrder}
            />
        </Stack>
    );
}
