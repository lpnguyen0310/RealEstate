package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.enums.VerificationStatus;
import com.backend.be_realestate.modals.dto.LegalCheckResult;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.service.IAIService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalVerificationService {

    private final PropertyRepository propertyRepository;
    private final IAIService aiService; // Inject Interface AI

    @Async
    @Transactional
    public void scanAndScore(Long propertyId) {
        PropertyEntity property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null) return;

        // Lấy ảnh đầu tiên trong list legal images
        String images = property.getLegalImages();
        if (images == null || images.isBlank()) return;

        String firstImageUrl = images.split(",")[0].trim();

        // GỌI AI SERVICE (Đã implement ở bước 3)
        LegalCheckResult result = aiService.verifyLegalDocument(
                firstImageUrl,
                property.getContactName(),
                property.getArea()
        );

        // Lưu kết quả vào DB
        property.setVerificationScore(result.getConfidenceScore());
        property.setVerificationAiData(convertToJson(result));
        property.setVerificationStatus(VerificationStatus.SCANNED);

        // Logic tự động duyệt nếu điểm quá cao (Optional)
        // if (result.getConfidenceScore() > 95 && !result.isFraudSuspected()) {
        //    property.setVerificationStatus(VerificationStatus.VERIFIED);
        // }

        propertyRepository.save(property);
    }

    private String convertToJson(Object o) {
        try { return new ObjectMapper().writeValueAsString(o); }
        catch (Exception e) { return "{}"; }
    }
}