package com.backend.be_realestate.modals.dto; // Hoặc package DTO của bạn

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionHistoryDTO {
    private String id; // ID của Order (ví dụ: 2510098...)
    private String status; // "Đang xử lý", "Thành công", "Thất bại"
    private String type; // "Mua gói", "Nạp tiền"
    private String amount; // "370.000đ"
    private String transactionCode; // Mã giao dịch ngắn gọn
    private String reason; // Lý do thất bại (nếu có)
    private LocalDateTime createdAt; // Ngày tạo
}