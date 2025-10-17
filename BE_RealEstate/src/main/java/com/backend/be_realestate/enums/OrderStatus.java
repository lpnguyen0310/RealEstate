package com.backend.be_realestate.enums;

public enum OrderStatus {
    DRAFT,             // (tuỳ chọn) tạo nháp
    PENDING_PAYMENT,   // đã chốt đơn, chờ thanh toán
    PAID,              // đã thanh toán
    CANCELED,          // huỷ bởi user/timeout
    EXPIRED            // hết hạn thanh toán

}
