// src/utils/invoicePdf.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Generate invoice PDF for an order
 * @param {Object} params
 * @param {number|string} params.orderId
 * @param {Array<{code:string, qty:number}>} params.itemsPayload    // các gói trong đơn
 * @param {number} params.total                                     // tổng tiền VND
 * @param {Object} params.profile                                   // profile user (nếu có)
 * @param {Array} params.allItems                                   // danh sách ALL_ITEMS (để map code -> name, price)
 */
export function generateInvoicePdf({
    orderId,
    itemsPayload = [],
    total = 0,
    profile,
    allItems = [],
}) {
    const doc = new jsPDF();

    const userName = profile?.fullName || profile?.name || profile?.email || "Khách hàng";
    const userEmail = profile?.email || "";
    const createdAt = new Date().toLocaleString("vi-VN");

    // Helper: tìm thông tin item từ ALL_ITEMS bằng code
    const findItemInfo = (code) => {
        if (!Array.isArray(allItems)) return null;
        return (
            allItems.find(
                (it) =>
                    it?._raw?.code?.toUpperCase() === String(code).toUpperCase()
            ) || null
        );
    };

    // ===== Header =====
    doc.setFontSize(16);
    doc.text("HÓA ĐƠN DỊCH VỤ ĐĂNG TIN", 14, 18);

    doc.setFontSize(11);
    doc.text(`Mã đơn hàng: #${orderId}`, 14, 26);
    doc.text(`Ngày tạo: ${createdAt}`, 14, 32);

    if (userName) doc.text(`Khách hàng: ${userName}`, 14, 40);
    if (userEmail) doc.text(`Email: ${userEmail}`, 14, 46);

    // ===== Bảng chi tiết =====
    const tableBody = itemsPayload.map((it, index) => {
        const info = findItemInfo(it.code);
        const title = info?.title || it.code || "Gói đăng tin";
        const qty = it.qty || 0;
        const price = Number(info?.price || 0);
        const lineTotal = qty * price;

        return [
            index + 1,
            title,
            String(it.code || ""),
            qty,
            price.toLocaleString("vi-VN"),
            lineTotal.toLocaleString("vi-VN"),
        ];
    });

    doc.autoTable({
        startY: 56,
        head: [["#", "Tên gói", "Mã gói", "SL", "Đơn giá (VND)", "Thành tiền (VND)"]],
        body: tableBody,
        styles: { fontSize: 10 },
        headStyles: {
            fillColor: [15, 47, 99], // #0f2f63
            textColor: 255,
        },
    });

    const finalY = doc.lastAutoTable.finalY || 56;

    // ===== Tổng tiền =====
    doc.setFontSize(12);
    doc.text(
        `Tổng cộng: ${Number(total || 0).toLocaleString("vi-VN")} VND`,
        14,
        finalY + 10
    );

    doc.setFontSize(10);
    doc.text(
        "Lưu ý: Đây là hóa đơn dịch vụ điện tử cho giao dịch mua gói đăng tin.",
        14,
        finalY + 18
    );

    // Save file
    doc.save(`invoice-order-${orderId}.pdf`);
}
