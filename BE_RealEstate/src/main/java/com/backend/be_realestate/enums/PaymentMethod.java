package com.backend.be_realestate.enums;

public enum PaymentMethod {
    COD,      // Tiền mặt khi nhận hàng
    VNPAY,
    STRIPE,
    BANK_QR,  // Chuyển khoản qua QR ngân hàng
    ZALOPAY,
    BALANCE,
}
