import { useState, useMemo, useCallback } from "react";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import { TxSearchBar, TxStatusTabs, TransactionTable } from "../../components/dashboard/historytransaction";
import { exportTransactionsXLSX } from "@/utils/exportXlsx";


const transactions = [
    { code: "251009V629585", status: "Đang xử lý", createdAt: "09/10/2025 10:31", amount: "25 nghìn", createdBy: "Nguyên Lê" },
    { code: "251009V777777", status: "Thành công", createdAt: "09/10/2025 08:12", amount: "150 nghìn", createdBy: "Nguyên Lê" },
    { code: "251009V999999", status: "Đã hủy", createdAt: "08/10/2025 09:00", amount: "50 nghìn", createdBy: "Nguyên Lê" },
];

const normalize = (s = "") =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const parseRowDate = (s) => {
    const d1 = dayjs(s, "DD/MM/YYYY HH:mm", true);
    if (d1.isValid()) return d1;
    return dayjs(s, "DD/MM/YYYY", true);
};



export default function TransactionsMangement() {
    const [orderCode, setOrderCode] = useState("");
    const [date, setDate] = useState(null);
    const [tabKey, setTabKey] = useState("all");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const counts = useMemo(() => {
        const all = transactions.length;
        const success = transactions.filter((t) => t.status === "Thành công").length;
        const processing = transactions.filter((t) => t.status === "Đang xử lý").length;
        const canceled = transactions.filter((t) => t.status === "Đã hủy").length;
        return { all, success, processing, canceled };
    }, []);

    const filteredData = useMemo(() => {
        const q = normalize(orderCode);
        return transactions
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
        exportTransactionsXLSX(transactions, "giao_dich.xlsx");
    };
    return (
        <Stack spacing={2.5}>
            {/* Search bar tách riêng */}
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

            <TransactionTable
                data={filteredData}
                page={page}
                pageSize={pageSize}
                totalItems={filteredData.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
        </Stack>
    );
}
