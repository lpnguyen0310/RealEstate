// src/pages/OrderManagement.jsx
import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack, CircularProgress, Typography } from "@mui/material";
import dayjs from "dayjs";

import {
  OrderSearchBar as TxSearchBar,
  OrderListTable as OrderTable,
  OrderStatusTabs as TxStatusTabs,
  OrderDetailModal,
} from "@/components/dashboard/ordermanagement";

import { exportTransactionsXLSX } from "@/utils/exportXlsx";
import { fetchMyOrders } from "@/store/orderSlice";

const normalize = (s = "") =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const parseRowDate = (s) => dayjs(s);

export default function OrderManagement() {
  const [orderCode, setOrderCode] = useState("");
  const [date, setDate] = useState(null);
  const [tabKey, setTabKey] = useState("all");
  const [page, setPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const dispatch = useDispatch();
  const { myOrders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const counts = useMemo(
    () => ({
      all: myOrders.length,
      success: myOrders.filter((t) => t.status === "PAID").length,
      processing: myOrders.filter((t) => t.status === "PENDING_PAYMENT").length,
      canceled: myOrders.filter((t) => t.status === "CANCELED").length,
    }),
    [myOrders]
  );

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
        const rowDay = parseRowDate(t.createdAt);
        return rowDay.isValid() && rowDay.isSame(date, "day");
      });
  }, [tabKey, orderCode, date, myOrders]);

  const handleSearch = useCallback(() => setPage(1), []);
  const handleExport = () =>
    exportTransactionsXLSX(filteredData, "danh_sach_don_hang.xlsx");

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  if (loading) {
    return (
      <Stack sx={{ height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Đang tải dữ liệu đơn hàng...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack sx={{ height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <Typography color="error">Lỗi: {error}</Typography>
      </Stack>
    );
  }

  return (
    <section className="w-full min-w-0">
      {/* Kiểu cũ: một cột trên mọi kích thước */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Search bar */}
        <div className="min-w-0">
          <TxSearchBar
            orderCode={orderCode}
            onOrderCodeChange={setOrderCode}
            date={date}
            onDateChange={(d) => {
              setDate(d);
              setPage(1);
            }}
            onSearch={handleSearch}
            onExport={handleExport}
          />
        </div>

        {/* Tabs (kéo ngang trên mobile nhờ overflow-x trong component) */}
        <div className="min-w-0">
          <TxStatusTabs
            activeKey={tabKey}
            onChange={(k) => {
              setTabKey(k);
              setPage(1);
            }}
            counts={counts}
          />
        </div>

        {/* Bảng (kéo ngang trên mobile nhờ overflow-x trong bảng hoặc bọc thêm lớp) */}
        <div className="min-w-0">
          <OrderTable
            data={filteredData}
            page={page}
            pageSize={pageSize}
            totalItems={filteredData.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Modal chi tiết */}
      <OrderDetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        order={selectedOrder}
      />
    </section>
  );
}
