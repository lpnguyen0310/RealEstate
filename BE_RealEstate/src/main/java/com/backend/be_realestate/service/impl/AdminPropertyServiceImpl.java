package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.response.PropertyShortResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.AdminPropertyService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminPropertyServiceImpl implements AdminPropertyService {

    private final PropertyRepository propertyRepository;
    private final ListingTypePolicyRepository policyRepo;
    private final UserInventoryRepository inventoryRepo;
    private final PropertyAuditRepository auditRepo; // nếu có bảng audit
    private final PropertyConverter propertyConverter;
    private final PropertyImage propertyImageRepository;

    @Override
    @Transactional
    public PropertyShortResponse approve(Long propertyId, ApprovePropertyRequest req, Long adminId) {
        PropertyEntity p = propertyRepository.lockById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (p.getStatus() == PropertyStatus.REJECTED) {
            throw new IllegalStateException("Rejected property cannot be approved");
        }

        // Cho phép đổi listingType khi duyệt (optional)
        ListingType targetType;

        if (req.getListingType() != null) {
            targetType = req.getListingType();
            ListingTypePolicy policy = policyRepo
                    .findFirstByListingTypeAndIsActive(targetType, 1L)
                    .orElseThrow(() -> new IllegalStateException("Policy not found or inactive for " + targetType));

            p.setListingTypePolicy(policy);
            p.setListingType(targetType);

            // CHÚ Ý: nếu bạn đã trừ kho lúc create theo listingType ban đầu thì thường không trừ nữa.
            // Nếu muốn trừ khi nâng từ NORMAL -> VIP/PREMIUM ở approve thì mở block dưới:

            if (p.getListingType() == ListingType.NORMAL && targetType != ListingType.NORMAL) {
                UserInventoryEntity inv = inventoryRepo.lockByUserAndType(p.getUser().getUserId(), targetType.name())
                        .orElseThrow(() -> new IllegalStateException("Inventory not found"));
                if (inv.getQuantity() == null || inv.getQuantity() <= 0) throw new OutOfStockException(targetType.name());
                inv.setQuantity(inv.getQuantity() - 1);
                inventoryRepo.save(inv);
            }

        } else {
            targetType = p.getListingType();
        }


        if (p.getPostedAt() == null) p.setPostedAt(Timestamp.from(Instant.now()));

        // hạn bài: ưu tiên req.durationDays, fallback policy
        int days = req.getDurationDays() != null && req.getDurationDays() > 0
                ? req.getDurationDays()
                : (p.getListingTypePolicy().getDurationDays() != null ? p.getListingTypePolicy().getDurationDays().intValue() : 30);

        p.setExpiresAt(Timestamp.from(Instant.now().plus(days, ChronoUnit.DAYS)));
        p.setStatus(PropertyStatus.PUBLISHED); // map sang FE là "PUBLISHED"
        propertyRepository.save(p);

        saveAudit(p, adminId, "APPROVED", req.getNote() != null ? req.getNote() :
                String.format("Approved %d days (%s)", days, targetType));

        return toShort(p);
    }

    @Override
    @Transactional
    public PropertyShortResponse reject(Long propertyId, RejectPropertyRequest req, Long adminId) {
        PropertyEntity p = propertyRepository.lockById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        p.setStatus(PropertyStatus.REJECTED);
        propertyRepository.save(p);

        saveAudit(p, adminId, "REJECTED", req.getReason());
        return toShort(p);
    }

    @Override
    @Transactional
    public PropertyShortResponse hide(Long propertyId, Long adminId) {
        PropertyEntity p = propertyRepository.lockById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (p.getStatus() != PropertyStatus.HIDDEN) {
            p.setStatus(PropertyStatus.HIDDEN);
            propertyRepository.save(p);
            saveAudit(p, adminId, "HIDDEN", "Hidden by admin");
        }
        return toShort(p);
    }

    @Override
    @Transactional
    public PropertyShortResponse unhide(Long propertyId, Long adminId) {
        PropertyEntity p = propertyRepository.lockById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (p.getExpiresAt() != null && p.getExpiresAt().toInstant().isBefore(Instant.now())) {
            throw new IllegalStateException("Cannot unhide expired property");
        }

        p.setStatus(PropertyStatus.ACTIVE);
        propertyRepository.save(p);
        saveAudit(p, adminId, "UNHIDDEN", "Unhidden by admin");
        return toShort(p);
    }

    @Override
    @Transactional
    public void hardDelete(Long propertyId) {
        auditRepo.deleteByPropertyId(propertyId);

        propertyRepository.deleteById(propertyId);
    }

    @Override
    public Page<PropertyDTO> search(int page, int size, String q, Long categoryId, String listingType, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "postedAt"));
        Specification<PropertyEntity> spec = (root, query, cb) -> cb.conjunction();

        // --- Keyword ---
        if (q != null && !q.isBlank()) {
            String kw = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), kw),
                    cb.like(cb.lower(root.join("user", JoinType.LEFT).get("fullName")), kw)
            ));
        }

        // --- Filter by Category ---
        if (categoryId != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.join("category", JoinType.LEFT).get("id"), categoryId));
        }

        // --- Filter by Listing Type ---
        if (listingType != null && !listingType.isBlank()) {
            try {
                ListingType listingEnum = ListingType.valueOf(listingType);
                spec = spec.and((root, cq, cb) -> cb.equal(root.get("listingType"), listingEnum));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid listingType: " + listingType);
            }
        }

        // --- Filter by Status ---
        if (status != null && !status.isBlank()) {
            try {
                PropertyStatus statusEnum = PropertyStatus.valueOf(status);
                spec = spec.and((root, cq, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }

        // --- Query DB ---
        Page<PropertyEntity> pageData = propertyRepository.findAll(spec, pageable);

        // --- Batch load images ---
        List<Long> ids = pageData.getContent().stream().map(PropertyEntity::getId).toList();
        Map<Long, List<String>> imageMap = new HashMap<>();
        if (!ids.isEmpty()) {
            List<PropertyImageEntity> allImages = propertyImageRepository.findAllByPropertyIdIn(ids);
            for (PropertyImageEntity img : allImages) {
                imageMap.computeIfAbsent(img.getProperty().getId(), k -> new ArrayList<>()).add(img.getImageUrl());
            }
        }

        // --- Convert to DTO ---
        return pageData.map(e -> {
            PropertyDTO dto = propertyConverter.toDto(e);
            dto.setImageUrls(imageMap.getOrDefault(e.getId(), List.of()));
            return dto;
        });
    }
    private void saveAudit(PropertyEntity p, Long adminId, String type, String message) {
        if (auditRepo == null) return; // nếu chưa có bảng audit
        PropertyAuditEntity a = new PropertyAuditEntity();
        a.setProperty(p);
        a.setActorId(adminId);
        a.setType(type);
        a.setMessage(message);
        a.setAt(Timestamp.from(Instant.now()));
        auditRepo.save(a);
    }

    private PropertyShortResponse toShort(PropertyEntity p) {
        return new PropertyShortResponse(
                p.getId(),
                p.getStatus().name(),
                p.getListingType().name(),
                p.getPostedAt() != null ? p.getPostedAt().toInstant() : null,
                p.getExpiresAt() != null ? p.getExpiresAt().toInstant() : null
        );
    }
}
