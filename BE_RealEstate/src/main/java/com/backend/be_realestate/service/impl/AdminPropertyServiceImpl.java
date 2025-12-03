package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyAuditDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.request.AdminPropertyBulkReq;
import com.backend.be_realestate.modals.response.PropertyShortResponse;
import com.backend.be_realestate.modals.response.admin.AdminPropertyStatsResponse;
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
import java.util.*;

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
    private final ReportRepository reportRepository;

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
        p.setReportCount(0);
        p.setLatestWarningMessage(null);

         List<Report> oldReports = reportRepository.findByPropertyId(propertyId);
         if (oldReports != null && !oldReports.isEmpty()) {
             reportRepository.deleteAll(oldReports);
         }
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
            String userLink = String.format("/dashboard/posts?tab=active&viewPostId=%d", savedProperty.getId());

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

        p.setStatus(PropertyStatus.PUBLISHED);
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
    @Transactional
    public List<PropertyShortResponse> bulkApprove(AdminPropertyBulkReq req, Long adminId) {
        if (req.getIds() == null || req.getIds().isEmpty()) {
            return Collections.emptyList();
        }

        // Chuyển đổi Bulk Request thành Single Request để tái sử dụng logic approve cũ
        ApprovePropertyRequest approveReq = new ApprovePropertyRequest(
                req.getListingType(),
                req.getDurationDays(),
                req.getNote()
        );

        List<PropertyShortResponse> results = new ArrayList<>();

        // Lưu ý: Tối ưu hiệu suất: bạn nên dùng propertyRepository.findAllById(req.getIds())
        // và lặp qua danh sách đã tải về thay vì gọi database cho từng ID.
        for (Long propertyId : req.getIds()) {
            try {
                // Tái sử dụng logic approve đơn lẻ
                PropertyShortResponse response = this.approve(propertyId, approveReq, adminId);
                results.add(response);
            } catch (Exception e) {
                log.error("Failed to bulk approve property ID {}: {}", propertyId, e.getMessage());
                // Log lỗi và tiếp tục với bài tiếp theo
            }
        }
        return results;
    }

    @Override
    @Transactional
    public List<PropertyShortResponse> bulkReject(AdminPropertyBulkReq req, Long adminId) {
        if (req.getIds() == null || req.getIds().isEmpty()) {
            return Collections.emptyList();
        }

        // VALIDATION: Lý do từ chối là bắt buộc
        if (req.getReason() == null || req.getReason().isBlank()) {
            throw new IllegalArgumentException("Reason is required for bulk rejection.");
        }

        // Chuyển đổi Bulk Request thành Single Request để tái sử dụng logic reject cũ
        RejectPropertyRequest rejectReq = new RejectPropertyRequest(req.getReason());

        List<PropertyShortResponse> results = new ArrayList<>();

        for (Long propertyId : req.getIds()) {
            try {
                // Tái sử dụng logic reject đơn lẻ
                PropertyShortResponse response = this.reject(propertyId, rejectReq, adminId);
                results.add(response);
            } catch (Exception e) {
                log.error("Failed to bulk reject property ID {}: {}", propertyId, e.getMessage());
                // Log lỗi và tiếp tục
            }
        }
        return results;
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

                // Cố gắng parse token thành Long (để tìm theo ID)
                Long parsedTokenId = null;
                try {
                    parsedTokenId = Long.parseLong(token);
                } catch (NumberFormatException e) {
                    // token không phải là số, bỏ qua
                }

                final Long finalId = parsedTokenId; // Sẽ là null nếu không phải số

                spec = spec.and((root, cq, cb) -> {
                    Join<PropertyEntity, ?> userJoin = root.join("user", JoinType.LEFT);
                    Join<PropertyEntity, ?> catJoin = root.join("category", JoinType.LEFT);

                    // Dùng List để thêm điều kiện một cách linh hoạt
                    List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

                    // (1) Thêm tất cả các điều kiện LIKE văn bản như cũ
                    predicates.add(cb.like(cb.lower(root.get("title")), kw));
                    predicates.add(cb.like(cb.lower(root.get("description")), kw));
                    predicates.add(cb.like(cb.lower(root.get("displayAddress")), kw));
                    predicates.add(cb.like(cb.lower(root.get("addressStreet")), kw));
                    predicates.add(cb.like(cb.lower(root.get("position")), kw));
                    predicates.add(cb.like(cb.lower(catJoin.get("name")), kw));
                    predicates.add(cb.like(cb.lower(userJoin.get("firstName")), kw));
                    predicates.add(cb.like(cb.lower(userJoin.get("lastName")), kw));

                    // (2) NẾU token là một số, THÊM điều kiện tìm chính xác theo ID
                    if (finalId != null) {
                        predicates.add(cb.equal(root.get("id"), finalId));
                    }

                    // Trả về một OR của tất cả các điều kiện
                    return cb.or(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
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
                          // Admin KHÔNG được xem DRAFT:
                                  if (statusEnum == PropertyStatus.DRAFT) {
                                        return Page.empty(pageable);
                                  }
                spec = spec.and((root, cq, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        } else {
                   // Khi KHÔNG truyền status -> mặc định loại DRAFT khỏi admin list
                           spec = spec.and((root, cq, cb) -> cb.notEqual(root.get("status"), PropertyStatus.DRAFT));
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

        Map<Long, List<PropertyAuditEntity>> auditsByProp = new HashMap<>();
        Map<Long, String> latestRejectReason = new HashMap<>();
        if (!ids.isEmpty()) {
            List<PropertyAuditEntity> audits = auditRepo.findByProperty_IdInOrderByAtDesc(ids);
            for (PropertyAuditEntity a : audits) {
                Long pid = a.getProperty().getId();
                auditsByProp.computeIfAbsent(pid, k -> new ArrayList<>()).add(a);

                // cache reject reason lần đầu gặp (vì list đã order desc)
                if ("REJECTED".equalsIgnoreCase(a.getType()) && !latestRejectReason.containsKey(pid)) {
                    latestRejectReason.put(pid, a.getMessage());
                }
            }
        }

        return pageData.map(e -> {
            PropertyDTO dto = propertyConverter.toDto(e);
            dto.setImageUrls(imageMap.getOrDefault(e.getId(), List.of()));
            // Map audits -> DTO
            List<PropertyAuditDTO> auditDtos = Optional.ofNullable(auditsByProp.get(e.getId()))
                    .orElseGet(List::of)
                    .stream()
                    .map(a -> PropertyAuditDTO.builder()
                            .at(a.getAt())
                            .type(a.getType())
                            .message(a.getMessage())
                            // by: nếu muốn resolve tên actor thì join thêm user repository bằng actorId
                            .by(null)
                            .build())
                    .toList();
            dto.setAudit(auditDtos);

            // Gán rejectReason (ưu tiên audit gần nhất type=REJECTED)
            dto.setRejectReason(latestRejectReason.get(e.getId()));

            return dto;
        });
    }

    @Override
    public AdminPropertyStatsResponse getAdminGlobalStats() {
        AdminPropertyStatsResponse dto = new AdminPropertyStatsResponse();

        dto.setPENDING_REVIEW(
                propertyRepository.countAllByStatus(PropertyStatus.PENDING_REVIEW)
        );
        dto.setPUBLISHED(
                propertyRepository.countAllByStatus(PropertyStatus.PUBLISHED)
        );
        dto.setHIDDEN(
                propertyRepository.countAllByStatus(PropertyStatus.HIDDEN)
        );
        dto.setREJECTED(
                propertyRepository.countAllByStatus(PropertyStatus.REJECTED)
        );
        dto.setEXPIRED(
                propertyRepository.countAllByStatus(PropertyStatus.EXPIRED)
        );
        // enum của bạn là EXPIRINGSOON (không có _)
        dto.setEXPIRING_SOON(
                propertyRepository.countAllByStatus(PropertyStatus.EXPIRINGSOON)
        );
        dto.setARCHIVED(
                propertyRepository.countAllByStatus(PropertyStatus.ARCHIVED)
        );

        return dto;
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
