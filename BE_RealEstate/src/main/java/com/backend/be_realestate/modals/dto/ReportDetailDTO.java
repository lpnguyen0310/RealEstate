package com.backend.be_realestate.modals.dto; // (hoặc package của bạn)

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class ReportDetailDTO {
    private Long id;
    private Set<String> reasons;
    private String details;
    private List<String> imageUrls;
    private String reporterEmail; // Chỉ gửi email, không gửi cả object User
    private LocalDateTime createdAt;
}