import * as XLSX from "xlsx";

/**
 * @typedef {Object} TxRow
 * @property {string} code
 * @property {string} status
 * @property {string|Date} createdAt
 * @property {string|number} amount
 * @property {string} createdBy
 */

/**
 * Xuất danh sách giao dịch ra file Excel (.xlsx)
 * @param {TxRow[]} rows - Danh sách giao dịch cần xuất
 * @param {string} [filename="transactions.xlsx"] - Tên file khi tải về
 */
export function exportTransactionsXLSX(rows, filename = "transactions.xlsx") {
    if (!rows || rows.length === 0) {
        console.warn("⚠️ Không có dữ liệu để xuất Excel.");
        return;
    }

    // Chuẩn hóa dữ liệu thành cột tiếng Việt
    const data = rows.map((r) => ({
        "Mã đơn hàng": r.code || "",
        "Trạng thái": r.status || "",
        "Ngày tạo":
            r.createdAt instanceof Date
                ? r.createdAt.toLocaleString("vi-VN")
                : r.createdAt || "",
        "Số tiền": r.amount || "",
        "Tạo bởi": r.createdBy || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Auto width tương đối
    const headers = Object.keys(data[0]);
    ws["!cols"] = headers.map((h) => ({
        wch:
            Math.max(h.length, ...data.map((row) => String(row[h] ?? "").length)) + 2,
    }));

    // Freeze dòng tiêu đề
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Tạo workbook và ghi file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GiaoDich");
    XLSX.writeFile(wb, filename);
}
