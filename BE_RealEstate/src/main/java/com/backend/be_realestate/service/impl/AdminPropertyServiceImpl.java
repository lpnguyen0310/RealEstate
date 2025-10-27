package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.response.PropertyShortResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.AdminPropertyService;
import com.backend.be_realestate.service.NotificationService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class AdminPropertyServiceImpl implements AdminPropertyService {

    private final PropertyRepository propertyRepository;
    private final ListingTypePolicyRepository policyRepo;
    private final UserInventoryRepository inventoryRepo;
    private final PropertyAuditRepository auditRepo; // nếu có bảng audit
    private final PropertyConverter propertyConverter;
    private final PropertyImage propertyImageRepository;

    private final NotificationServiceImpl notificationService;

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
        PropertyEntity savedProperty = propertyRepository.save(p);

        try {
            log.info("[PropertyService] Tin đăng {} đã được DUYỆT, đang gửi thông báo...", savedProperty.getId());

            String title = savedProperty.getTitle();
            if (title == null || title.isBlank()) {
                title = "không có tiêu đề";
            } else if (title.length() > 50) {
                // Rút gọn tiêu đề cho ngắn
                title = title.substring(0, 47) + "...";
            }

            // --- GỬI THÔNG BÁO CHO NGƯỜI ĐĂNG (AUTHOR) ---
            String userMessage = String.format("Tin đăng '%s' của bạn đã được duyệt thành công!", title);

            // Sửa link tới tab "Đang đăng"
            String userLink = "/dashboard/posts?tab=active";

            // *** Đây là lúc sử dụng service đã "tiêm" ***
            notificationService.createNotification(
                    savedProperty.getUser(), // Lấy user ID từ property đã lưu
                    NotificationType.LISTING_APPROVED, // <-- Bạn cần tạo Enum này
                    userMessage,
                    userLink
            );
            log.info("[PropertyService] Đã gửi thông báo LISTING_APPROVED cho user {}.", savedProperty.getUser().getUserId());

        } catch (Exception e) {
            // Rất quan trọng: Vẫn bắt lỗi để nếu gửi noti lỗi,
            // nó KHÔNG làm rollback việc DUYỆT TIN
            log.error("!!!!!!!!!!!! LỖI KHI GỬI NOTIFICATION 'APPROVED' (nhưng tin đăng đã duyệt thành công): {}", e.getMessage(), e);
        }

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

        // ====== KEYWORD (tokenized) ======
        if (q != null && !q.isBlank()) {
            String[] tokens = q.trim().toLowerCase().split("\\s+");
            for (String token : tokens) {
                String kw = "%" + token + "%";
                spec = spec.and((root, cq, cb) -> {
                    Join<PropertyEntity, ?> userJoin = root.join("user", JoinType.LEFT);
                    Join<PropertyEntity, ?> catJoin = root.join("category", JoinType.LEFT);

                    return cb.or(
                            cb.like(cb.lower(root.get("title")), kw),
                            cb.like(cb.lower(root.get("description")), kw),
                            cb.like(cb.lower(root.get("displayAddress")), kw),
                            cb.like(cb.lower(root.get("addressStreet")), kw),
                            cb.like(cb.lower(root.get("position")), kw),
                            cb.like(cb.lower(catJoin.get("name")), kw),
                            cb.like(cb.lower(userJoin.get("firstName")), kw),
                            cb.like(cb.lower(userJoin.get("lastName")), kw)
                    );
                });
            }
        }

        // ====== FILTER: Category ======
        if (categoryId != null) {
            spec = spec.and((root, cq, cb) ->
                    cb.equal(root.join("category", JoinType.LEFT).get("id"), categoryId)
            );
        }

        // ====== FILTER: Listing Type ======
        if (listingType != null && !listingType.isBlank()) {
            try {
                ListingType listingEnum = ListingType.valueOf(listingType);
                spec = spec.and((root, cq, cb) -> cb.equal(root.get("listingType"), listingEnum));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid listingType: " + listingType);
            }
        }

        // ====== FILTER: Status ======
        if (status != null && !status.isBlank()) {
            try {
                PropertyStatus statusEnum = PropertyStatus.valueOf(status);
                spec = spec.and((root, cq, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }

        // ====== QUERY DB ======
        Page<PropertyEntity> pageData = propertyRepository.findAll(spec, pageable);

        // ====== BATCH LOAD IMAGES ======
        List<Long> ids = pageData.getContent().stream().map(PropertyEntity::getId).toList();
        Map<Long, List<String>> imageMap = new HashMap<>();
        if (!ids.isEmpty()) {
            List<PropertyImageEntity> allImages = propertyImageRepository.findAllByPropertyIdIn(ids);
            for (PropertyImageEntity img : allImages) {
                imageMap.computeIfAbsent(img.getProperty().getId(), k -> new ArrayList<>()).add(img.getImageUrl());
            }
        }

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
