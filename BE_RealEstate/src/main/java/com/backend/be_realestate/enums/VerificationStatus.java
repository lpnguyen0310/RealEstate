package com.backend.be_realestate.enums;

public enum VerificationStatus {
    UNVERIFIED,     // Mặc định: Chưa làm gì cả
    PENDING_SCAN,   // User đã up ảnh, đang chờ AI chạy
    SCANNED,        // AI chạy xong, chờ Admin chốt
    VERIFIED,       // Admin đã duyệt -> Có Tick Xanh
    REJECTED        // Từ chối
}
