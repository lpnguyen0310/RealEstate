package com.backend.be_realestate.modals.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class LegalCheckResult {
    private Double confidenceScore; // 0 - 100 (Điểm tin cậy tổng thể)
    private String extractedOwnerName; // Tên AI đọc được
    private Double extractedArea;      // Diện tích AI đọc được
    private String matchDetails;       // Lý giải: "Tên khớp 90%, diện tích lệch 0.5m2"
    private boolean isFraudSuspected;  // AI nghi ngờ ảnh fake/photoshop
}