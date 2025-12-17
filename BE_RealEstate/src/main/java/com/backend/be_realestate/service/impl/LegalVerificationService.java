package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalVerificationService {

    private final PropertyRepository propertyRepository;
    private final IAIService aiService;

    @Async
    @Transactional
    public void scanAndScore(Long propertyId) {
        PropertyEntity property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null) return;

        // 1. Lấy ảnh từ List Entity (Bảng con property_images)
        List<PropertyImageEntity> deedImages = property.getDeedFiles();

        if (deedImages == null || deedImages.isEmpty()) {
            log.warn("Property ID {} status PENDING_SCAN nhưng không có ảnh LEGAL_DEED", propertyId);
            return;
        }

        String firstImageUrl = deedImages.get(0).getImageUrl();
        log.info("AI đang xử lý ảnh: {}", firstImageUrl);

        // --- 2. SỬA LẠI ĐOẠN NÀY: TẠO BIẾN fullAddress ---
        StringBuilder fullAddress = new StringBuilder();

        // Ghép địa chỉ chi tiết (nếu có)
        if (property.getAddressStreet() != null && !property.getAddressStreet().isBlank()) {
            fullAddress.append(property.getAddressStreet()).append(", ");
        }
        // Ghép Phường/Xã
        if (property.getWard() != null) {
            fullAddress.append(property.getWard().getName()).append(", ");
        }
        // Ghép Quận/Huyện
        if (property.getDistrict() != null) {
            fullAddress.append(property.getDistrict().getName()).append(", ");
        }
        // Ghép Tỉnh/TP
        if (property.getCity() != null) {
            fullAddress.append(property.getCity().getName());
        }

        // Nếu không ghép được gì (data rỗng) thì lấy displayAddress làm fallback
        String addressToSend = fullAddress.toString();
        if (addressToSend.isBlank() && property.getDisplayAddress() != null) {
            addressToSend = property.getDisplayAddress();
        }
        // ------------------------------------------------

        // 3. GỌI AI SERVICE (Truyền addressToSend vào)
        LegalCheckResult result = aiService.verifyLegalDocument(
                firstImageUrl,
                property.getContactName(),
                property.getArea(),
                addressToSend // <--- Biến đã được tạo ở trên
        );

        // 4. Lưu kết quả vào DB
        property.setVerificationScore(result.getConfidenceScore());
        property.setVerificationAiData(convertToJson(result));
        property.setVerificationStatus(VerificationStatus.SCANNED);

        propertyRepository.save(property);
    }

    private String convertToJson(Object o) {
        try { return new ObjectMapper().writeValueAsString(o); }
        catch (Exception e) { return "{}"; }
    }
}