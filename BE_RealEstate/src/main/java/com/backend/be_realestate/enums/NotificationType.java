package com.backend.be_realestate.enums;

public enum NotificationType {
    // Dành cho User
    LISTING_APPROVED,   // Tin được duyệt
    LISTING_REJECTED,   // Tin bị từ chối
    LISTING_EXPIRED,    // Tin hết hạn
    PACKAGE_PURCHASED,  // Mua gói thành công
    PACKAGE_EXPIRED,    // Gói sắp hết hạn

    LISTING_PENDING_USER,
    LISTING_FAVORITED,

    TOP_UP_SUCCESSFUL, // <-- THÊM MỚI: Nạp tiền vào tài khoản thành công

    // Dành cho Admin
    NEW_LISTING_PENDING, // Có tin mới chờ duyệt
    NEW_USER_REGISTERED, // Có user mới
    REPORT_SUBMITTED,    // Có báo cáo mới

    ORDER_PENDING,      // 1. User tạo đơn hàng, chờ thanh toán
    NEW_ORDER_PAID,      // 2. Admin nhận thông báo có đơn hàng MỚI được thanh toán
    ORDER_REFUNDED,

    PROPERTY_REPORT_WARNING,
    REPORT_STATUS_UPDATE,
    SYSTEM_ANNOUNCEMENT,
    POST_WARNING,
    LISTING_EDITED_PENDING,


    SUPPORT_CONVERSATION_CREATED,
    SUPPORT_ASSIGNMENT,
    SUPPORT_MESSAGE_RECEIVED,
    SUPPORT_CONVERSATION_RESOLVED,

    LISTING_HIDDEN,          // User ẩn tin
    LISTING_UNHIDDEN,        // User bỏ ẩn tin
    LISTING_MARKED_SOLD,     // User đánh dấu đã bán
    LISTING_UNMARKED_SOLD,   // User gỡ trạng thái đã bán
}
