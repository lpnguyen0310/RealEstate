// src/pages/Dashboard/TransactionsManagement.jsx
import { useMemo, useState } from "react";
import { Stack } from "@mui/material";
import TxTabs from "@/components/dashboard/transactionsmanagement/TxTabs";
import TransactionTable from "@/components/dashboard/transactionsmanagement/TransactionTable";
import TransactionDetailModal from "@/components/dashboard/transactionsmanagement/TransactionDetailModal";
import { TRANSACTIONS } from "@/data/Dashboard/OrderManagementData";

export default function TransactionsManagement() {
  const [tabKey, setTabKey] = useState("processing");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [selectedTx, setSelectedTx] = useState(null);
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => ({
    processing: TRANSACTIONS.filter(t => t.status === "Đang xử lý").length,
    success: TRANSACTIONS.filter(t => t.status === "Thành công").length,
    failed: TRANSACTIONS.filter(t => t.status === "Thất bại").length,
  }), []);

  const filtered = useMemo(() => {
    if (tabKey === "processing") return TRANSACTIONS.filter(t => t.status === "Đang xử lý");
    if (tabKey === "success") return TRANSACTIONS.filter(t => t.status === "Thành công");
    return TRANSACTIONS.filter(t => t.status === "Thất bại");
  }, [tabKey]);

  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const pageData = filtered.slice(startIdx, startIdx + pageSize);

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
