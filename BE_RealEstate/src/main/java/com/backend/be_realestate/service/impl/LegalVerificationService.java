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

import java.util.ArrayList;
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

        // 1. TỔNG HỢP ẢNH (Gom Sổ đỏ + Ủy quyền vào 1 list tạm)
        List<String> imagesToSend = new ArrayList<>();

        // A. Lấy ảnh Sổ đỏ (Deed)
        List<PropertyImageEntity> deedImages = property.getDeedFiles();
        if (deedImages != null) {
            imagesToSend.addAll(deedImages.stream().map(PropertyImageEntity::getImageUrl).toList());
        }

        // B. Lấy ảnh Ủy quyền (Authorization) - Chỉ lấy nếu có
        List<PropertyImageEntity> authImages = property.getAuthorizationFiles(); // Giả sử trong Entity bạn đã có field này
        if (authImages != null && !authImages.isEmpty()) {
            imagesToSend.addAll(authImages.stream().map(PropertyImageEntity::getImageUrl).toList());
        }

        // Nếu không có ảnh nào thì dừng
        if (imagesToSend.isEmpty()) {
            log.warn("Property ID {} status PENDING_SCAN nhưng không có ảnh pháp lý nào", propertyId);
            return;
        }

        log.info("AI đang xử lý tổng cộng {} ảnh (Sổ + Ủy quyền)", imagesToSend.size());

        // 2. TẠO CHUỖI ĐỊA CHỈ (Logic cũ giữ nguyên - rất quan trọng để AI so sánh)
        StringBuilder fullAddress = new StringBuilder();
        if (property.getAddressStreet() != null && !property.getAddressStreet().isBlank()) {
            fullAddress.append(property.getAddressStreet()).append(", ");
        }
        if (property.getWard() != null) {
            fullAddress.append(property.getWard().getName()).append(", ");
        }
        if (property.getDistrict() != null) {
            fullAddress.append(property.getDistrict().getName()).append(", ");
        }
        if (property.getCity() != null) {
            fullAddress.append(property.getCity().getName());
        }
        String addressToSend = fullAddress.toString();
        if (addressToSend.isBlank() && property.getDisplayAddress() != null) {
            addressToSend = property.getDisplayAddress();
        }

        // 3. GỌI AI SERVICE (Truyền List ảnh)
        LegalCheckResult result = aiService.verifyLegalDocument(
                imagesToSend, // <--- Truyền List đã gộp
                property.getContactName(),
                property.getArea(),
                addressToSend
        );

        // 4. LƯU KẾT QUẢ
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