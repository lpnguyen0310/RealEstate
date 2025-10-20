import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Stack, CircularProgress, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  OrderSearchBar as TxSearchBar,
  OrderListTable as OrderTable,
  OrderStatusTabs as TxStatusTabs,
  OrderDetailModal
} from "@/components/dashboard/ordermanagement";
import { exportTransactionsXLSX } from "@/utils/exportXlsx";
import { fetchMyOrders } from '@/store/orderSlice';

const normalize = (s = "") =>
  String(s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// ✨ SỬA LẠI HÀM NÀY CHO ĐÚNG ĐỊNH DẠNG TỪ API
const parseRowDate = (s) => {
  // dayjs có thể tự động đọc chuỗi ngày tháng theo chuẩn ISO 8601
  return dayjs(s);
};

export default function OrderManagement() {
  const [orderCode, setOrderCode] = useState("");
  const [date, setDate] = useState(null);
  const [tabKey, setTabKey] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const dispatch = useDispatch();
  const { myOrders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const counts = useMemo(() => ({
    all: myOrders.length,
    success: myOrders.filter((t) => t.status === "PAID").length,
    processing: myOrders.filter((t) => t.status === "PENDING_PAYMENT").length,
    canceled: myOrders.filter((t) => t.status === "CANCELED").length,
  }), [myOrders]);

  const filteredData = useMemo(() => {
    const q = normalize(orderCode);
    return myOrders
      .filter((t) => {
        if (tabKey === "all") return true;
        if (tabKey === "success") return t.status === "PAID";
        if (tabKey === "processing") return t.status === "PENDING_PAYMENT";
        if (tabKey === "canceled") return t.status === "CANCELED";
        return true;
      })
      .filter((t) => (q ? normalize(t.orderId).includes(q) : true))
      .filter((t) => {
        if (!date) return true;
        const rowDay = parseRowDate(t.createdAt); // Bây giờ sẽ hoạt động đúng
        return rowDay.isValid() && rowDay.isSame(date, "day");
      });
  }, [tabKey, orderCode, date, myOrders]);
  
  const handleSearch = useCallback(() => setPage(1), []);
  
  const handleExport = () => {
    exportTransactionsXLSX(filteredData, "danh_sach_don_hang.xlsx");
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  if (loading) {
    return (
      <Stack sx={{ height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography mt={2}>Đang tải dữ liệu đơn hàng...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack sx={{ height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Lỗi: {error}</Typography>
      </Stack>
    );
  }

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