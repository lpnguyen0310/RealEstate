// Mỗi transaction liên kết tới 1 đơn hàng qua orderCode
export const TRANSACTIONS = [
    // ==== ĐANG XỬ LÝ ====
    {
        id: "251009064746G317367",
        orderCode: "251009V629585",
        status: "Đang xử lý",
        type: "Mua gói",
        amount: "399 nghìn",
        txCode: "479654",
        reason: "",
        createdAt: "09/10/2025 01:47",
    },
    {
        id: "251009064725K453389",
        orderCode: "251009V629585",
        status: "Đang xử lý",
        type: "Mua gói",
        amount: "25 nghìn",
        txCode: "479652",
        reason: "",
        createdAt: "09/10/2025 01:47",
    },

    // ==== THÀNH CÔNG ====
    {
        id: "251009777777D000001",
        orderCode: "251009V777777",
        status: "Thành công",
        type: "Mua gói",
        amount: "150 nghìn",
        txCode: "479700",
        reason: "",
        createdAt: "09/10/2025 08:12",
    },

    // ==== THẤT BẠI ====
    {
        id: "251009999999F000001",
        orderCode: "251009V999999",
        status: "Thất bại",
        type: "Mua gói",
        amount: "50 nghìn",
        txCode: "479999",
        reason: "Thanh toán bị hủy",
        createdAt: "08/10/2025 09:00",
    },
];
