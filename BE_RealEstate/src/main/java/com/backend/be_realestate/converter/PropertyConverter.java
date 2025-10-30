package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyAuditDTO;
import com.backend.be_realestate.repository.PropertyAuditRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PropertyConverter {

    private final ModelMapper modelMapper;
    private final PropertyAuditRepository auditRepo;

    /* ===================== SINGLE ===================== */
    public PropertyDTO toDto(PropertyEntity entity) {
        PropertyDTO dto = modelMapper.map(entity, PropertyDTO.class);

        // --- FK ids ---
        if (entity.getUser() != null)     dto.setUserId(entity.getUser().getUserId());
        if (entity.getCategory() != null) dto.setCategoryId(entity.getCategory().getId());
        if (entity.getWard() != null)     dto.setWardId(entity.getWard().getId());
        if (entity.getDistrict() != null) dto.setDistrictId(entity.getDistrict().getId());
        if (entity.getCity() != null)     dto.setCityId(entity.getCity().getId());

        // --- Extra for UI ---
        if (entity.getCategory() != null) dto.setCategoryName(entity.getCategory().getName());
        if (entity.getUser() != null) {
            dto.setAuthorName((entity.getUser().getFirstName() + " " + entity.getUser().getLastName()).trim());
            dto.setAuthorEmail(entity.getUser().getEmail());
        }

        // --- Images (order by displayOrder) ---
        if (entity.getImages() != null) {
            List<String> urls = entity.getImages().stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingInt(i -> i.getDisplayOrder() == null ? 0 : i.getDisplayOrder()))
                    .map(PropertyImageEntity::getImageUrl)
                    .toList();
            dto.setImageUrls(urls);
        }

        // --- Amenities ---
        if (entity.getAmenities() != null) {
            List<Long> amenityIds = entity.getAmenities().stream()
                    .filter(Objects::nonNull)
                    .map(AmenityEntity::getId)
                    .toList();
            dto.setAmenityIds(amenityIds);
        }

        // --- Policy duration ---
        if (entity.getListingTypePolicy() != null) {
            dto.setDurationDays((long) entity.getListingTypePolicy().getDurationDays());
        }

        // --- Time & counters ---
        dto.setPostedAt(entity.getPostedAt());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setFavoriteCount(entity.getFavoriteCount());

        // --- Listing type as String ---
        if (entity.getListingType() != null) {
            dto.setListingType(entity.getListingType().name()); // NORMAL | VIP | PREMIUM
        }

        // =============== AUDIT ENRICHMENT (single) ===============
        if (entity.getId() != null) {
            // 1) toàn bộ lịch sử (mới -> cũ)
            List<PropertyAuditDTO> audits = auditRepo
                    .findAllByProperty_IdOrderByAtDesc(entity.getId())
                    .stream()
                    .map(this::mapAudit)
                    .toList();
            dto.setAudit(audits);

            // 2) lý do từ chối gần nhất
            auditRepo.findFirstByProperty_IdAndTypeOrderByAtDesc(entity.getId(), "REJECTED")
                    .map(PropertyAuditEntity::getMessage)
                    .ifPresent(dto::setRejectReason);
        }

        return dto;
    }

    /* ===================== BATCH (tránh N+1) ===================== */
    public List<PropertyDTO> toDtosWithAudit(List<PropertyEntity> entities) {
        if (entities == null || entities.isEmpty()) return Collections.emptyList();

        // 1) map cơ bản
        List<PropertyDTO> dtos = entities.stream().map(this::toDtoWithoutAudit).toList();

        // 2) lấy audit cho tất cả id trong 1 query
        List<Long> ids = entities.stream()
                .map(PropertyEntity::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, List<PropertyAuditEntity>> byProp = auditRepo
                .findByProperty_IdInOrderByAtDesc(ids)
                .stream()
                .collect(Collectors.groupingBy(a -> a.getProperty().getId(), LinkedHashMap::new, Collectors.toList()));

        // 3) gắn audits + rejectReason vào DTO
        for (PropertyDTO dto : dtos) {
            Long pid = dto.getId();
            List<PropertyAuditEntity> list = byProp.getOrDefault(pid, Collections.emptyList());
            dto.setAudit(list.stream().map(this::mapAudit).toList());

            list.stream().filter(a -> "REJECTED".equalsIgnoreCase(a.getType()))
                    .findFirst()
                    .map(PropertyAuditEntity::getMessage)
                    .ifPresent(dto::setRejectReason);
        }
        return dtos;
    }

    /* ===================== Helpers ===================== */
    private PropertyDTO toDtoWithoutAudit(PropertyEntity entity) {
        // phần này giống toDto(...) nhưng KHÔNG load audit để dùng cho batch
        PropertyDTO dto = modelMapper.map(entity, PropertyDTO.class);

        if (entity.getUser() != null)     dto.setUserId(entity.getUser().getUserId());
        if (entity.getCategory() != null) dto.setCategoryId(entity.getCategory().getId());
        if (entity.getWard() != null)     dto.setWardId(entity.getWard().getId());
        if (entity.getDistrict() != null) dto.setDistrictId(entity.getDistrict().getId());
        if (entity.getCity() != null)     dto.setCityId(entity.getCity().getId());

        if (entity.getCategory() != null) dto.setCategoryName(entity.getCategory().getName());
        if (entity.getUser() != null) {
            dto.setAuthorName((entity.getUser().getFirstName() + " " + entity.getUser().getLastName()).trim());
            dto.setAuthorEmail(entity.getUser().getEmail());
        }

        if (entity.getImages() != null) {
            List<String> urls = entity.getImages().stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingInt(i -> i.getDisplayOrder() == null ? 0 : i.getDisplayOrder()))
                    .map(PropertyImageEntity::getImageUrl)
                    .toList();
            dto.setImageUrls(urls);
        }

        if (entity.getAmenities() != null) {
            List<Long> amenityIds = entity.getAmenities().stream()
                    .filter(Objects::nonNull)
                    .map(AmenityEntity::getId)
                    .toList();
            dto.setAmenityIds(amenityIds);
        }

        if (entity.getListingTypePolicy() != null) {
            dto.setDurationDays((long) entity.getListingTypePolicy().getDurationDays());
        }

        dto.setPostedAt(entity.getPostedAt());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setFavoriteCount(entity.getFavoriteCount());

        if (entity.getListingType() != null) {
            dto.setListingType(entity.getListingType().name());
        }
        return dto;
    }

    private PropertyAuditDTO mapAudit(PropertyAuditEntity a) {
        return PropertyAuditDTO.builder()
                .type(a.getType())
                .message(a.getMessage())
                .at(safeTs(a.getAt()))
                // bạn chưa join User => tạm hiển thị "User#<id>", cần đẹp hơn thì join user để lấy tên
                .by(a.getActorId() == null ? null : ("User#" + a.getActorId()))
                .build();
    }

    private Timestamp safeTs(Timestamp t) { return t == null ? null : t; }

    /* ===================== Reverse ===================== */
    public PropertyEntity toEntity(PropertyDTO dto) {
        return modelMapper.map(dto, PropertyEntity.class);
    }
}
