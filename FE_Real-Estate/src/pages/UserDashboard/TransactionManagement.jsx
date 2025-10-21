// src/pages/Dashboard/TransactionsManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "@mui/material";
import TxTabs from "@/components/dashboard/transactionsmanagement/TxTabs";
import TransactionTable from "@/components/dashboard/transactionsmanagement/TransactionTable";
import TransactionDetailModal from "@/components/dashboard/transactionsmanagement/TransactionDetailModal";

import {
  loadTransactions,
  selectCounts,
  selectByTab,
  selectLoading,
  selectError,
} from "@/store/transactionsSlice";

export default function TransactionsManagement() {
  const dispatch = useDispatch();

  const [tabKey, setTabKey] = useState("processing");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [selectedTx, setSelectedTx] = useState(null);
  const [open, setOpen] = useState(false);

  const counts = useSelector(selectCounts);
  const listByTab = useSelector(useMemo(() => selectByTab(tabKey), [tabKey]));
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    dispatch(loadTransactions());
  }, [dispatch]);

  // Phân trang client
  const total = listByTab.length;
  const startIdx = (page - 1) * pageSize;
  const pageData = listByTab.slice(startIdx, startIdx + pageSize);

  const handleRowClick = (tx) => {
    setSelectedTx(tx);
    setOpen(true);
  };

  return (
    <Stack spacing={2.5}>
      <TxTabs
        active={tabKey}
        counts={counts}
        onChange={(k) => { setTabKey(k); setPage(1); }}
      />

      {loading && <div>Đang tải giao dịch…</div>}
      {error && <div className="text-red-600">Lỗi: {error}</div>}

      <TransactionTable
        data={pageData}
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={handleRowClick}
      />

      <TransactionDetailModal
        open={open}
        onClose={() => setOpen(false)}
        tx={selectedTx}
      />
    </Stack>
  );
}
