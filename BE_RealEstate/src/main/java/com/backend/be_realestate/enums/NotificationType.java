package com.backend.be_realestate.enums;

public enum NotificationType {
    // Dành cho User
    LISTING_APPROVED,   // Tin được duyệt
    LISTING_REJECTED,   // Tin bị từ chối
    LISTING_EXPIRED,    // Tin hết hạn
    PACKAGE_PURCHASED,  // Mua gói thành công
    PACKAGE_EXPIRED,    // Gói sắp hết hạn

    LISTING_PENDING_USER,

    // Dành cho Admin
    NEW_LISTING_PENDING, // Có tin mới chờ duyệt
    NEW_USER_REGISTERED, // Có user mới
    REPORT_SUBMITTED,    // Có báo cáo mới

    ORDER_PENDING,      // 1. User tạo đơn hàng, chờ thanh toán
    NEW_ORDER_PAID      // 2. Admin nhận thông báo có đơn hàng MỚI được thanh toán
}
