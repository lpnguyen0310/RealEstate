package com.backend.be_realestate.enums;

public enum OrderStatus {
    DRAFT,
    PENDING_PAYMENT,   // Đã chốt, chờ thanh toán

    // Trạng thái đã thanh toán/Thực hiện
    PAID,              // Đã nhận thanh toán
    PROCESSING,        // (Tùy chọn) Đang xử lý/chuẩn bị dịch vụ
    COMPLETED,         // Đã hoàn thành/kích hoạt dịch vụ

    // Trạng thái thất bại/Hủy
    CANCELED,          // Hủy bởi Admin/User/Timeout
    REFUNDED,          // Đã hoàn tiền
    FAILED,            // Giao dịch thanh toán thất bại
    EXPIRED            // Hết hạn thanh toán
}