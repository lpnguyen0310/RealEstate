package com.backend.be_realestate.modals.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class LegalCheckResult {
    private Double confidenceScore;
    private String extractedOwnerName;
    private Double extractedArea;
    private String matchDetails;

    // Thêm cái này cho chắc, phòng hờ AI trả về key này
    @JsonProperty("isFraudSuspected")
    private boolean isFraudSuspected;

    private String extractedAddress;
    private String authDelegatorName;
    private String authDelegateeName;

    // 👇 2. THÊM DÒNG NÀY ĐỂ FIX LỖI CHÍNH
    @JsonProperty("isAuthorized")
    private boolean isAuthorized;
}