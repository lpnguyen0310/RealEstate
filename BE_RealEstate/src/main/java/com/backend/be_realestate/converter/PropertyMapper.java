package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.AgentDTO;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.detail.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
public class PropertyMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PropertyCardDTO toPropertyCardDTO(PropertyEntity entity) {
        if (entity == null) {
            return null;
        }

        PropertyCardDTO dto = new PropertyCardDTO();

        // --- Mapping thông tin cơ bản ---
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setArea(entity.getArea());
        dto.setDescription(entity.getDescription()); // Giả định đã có cột description
        dto.setBed(entity.getBedrooms() != null ? entity.getBedrooms() : 0);
        dto.setBath(entity.getBathrooms() != null ? entity.getBathrooms() : 0);

        // --- Xử lý hình ảnh ---
        if (entity.getImages() != null && !entity.getImages().isEmpty()) {
            List<PropertyImageEntity> sortedImages = entity.getImages().stream()
                    .sorted(Comparator.comparing(PropertyImageEntity::getDisplayOrder))
                    .collect(Collectors.toList());

            dto.setImage(sortedImages.get(0).getImageUrl());
            dto.setPhotos(sortedImages.size());
            dto.setImages(sortedImages.stream()
                    .map(PropertyImageEntity::getImageUrl)
                    .collect(Collectors.toList()));
        } else {
            dto.setImage("/default-image.jpg");
            dto.setPhotos(0);
            dto.setImages(Collections.emptyList());
        }

        dto.setPostedAt(formatRelativeTime(entity.getPostedAt()));

        // --- Ghép chuỗi địa chỉ ---
        dto.setAddressShort(formatShortAddress(entity));
        dto.setAddressFull(formatFullAddress(entity));

        // --- Mapping thông tin liên quan ---
        if (entity.getUser() != null) {
            dto.setAgent(toAgentDTO(entity.getUser()));
        }
        if (entity.getPropertyType() != null) {
            dto.setType(entity.getPropertyType().name().toLowerCase());
        }
        if (entity.getCategory() != null) {
            dto.setCategory(entity.getCategory().getSlug());
        }

        return dto;
    }

    // =================================================================================
    // MAPPER CHO DETAIL VIEW (PHẦN BỔ SUNG MỚI)
    // =================================================================================

    public PropertyDetailDTO toPropertyDetailDTO(PropertyEntity entity) {
        if (entity == null) return null;

        PropertyDetailDTO dto = new PropertyDetailDTO();

        dto.setGallery(entity.getImages().stream()
                .sorted(Comparator.comparing(PropertyImageEntity::getDisplayOrder))
                .map(PropertyImageEntity::getImageUrl)
                .collect(Collectors.toList()));

        dto.setPostInfo(buildPostInfo(entity));
        dto.setFeatures(buildFeatures(entity));

        MapDTO mapDTO = new MapDTO();
        dto.setMap(mapDTO);

        dto.setMapMeta(buildMapMeta(entity));
        dto.setAgent(buildAgentDetail(entity.getUser()));

        return dto;
    }

    // =================================================================================
    // CÁC PHƯƠNG THỨC PHỤ TRỢ (PRIVATE HELPERS)
    // =================================================================================

    private AgentDTO toAgentDTO(UserEntity userEntity) {
        if (userEntity == null) return null;
        AgentDTO agentDto = new AgentDTO();
        agentDto.setName(userEntity.getFirstName() + " " + userEntity.getLastName());
        agentDto.setPhone(userEntity.getPhone());
        agentDto.setAvatar(userEntity.getAvatar());
        agentDto.setZaloUrl(userEntity.getZalo_url());
        return agentDto;
    }

    private PostInfoDTO buildPostInfo(PropertyEntity entity) {
        PostInfoDTO postInfo = new PostInfoDTO();
        // TODO: Logic tạo breadcrumb động có thể phức tạp
        postInfo.setTitle(entity.getTitle());
        postInfo.setAddress(formatFullAddress(entity));

        StatsDTO stats = new StatsDTO();
        stats.setPriceText(formatPrice(entity.getPrice().longValue()));

        stats.setAreaText(entity.getArea() + " m²");

        postInfo.setStats(stats);

        // TODO: Logic tính toán tăng trưởng giá thực tế từ bảng PriceHistoryEntity
        GrowthNoticeDTO growth = new GrowthNoticeDTO();
        growth.setText("+ 5% · Giá ổn định");
        growth.setCta("Xem lịch sử giá ›");
        postInfo.setGrowthNotice(growth);

        return postInfo;
    }

    private DescriptionDTO buildDescription(String descriptionJson) {
        if (descriptionJson == null || descriptionJson.isEmpty()) {
            return new DescriptionDTO();
        }
        try {
            return objectMapper.readValue(descriptionJson, DescriptionDTO.class);
        } catch (Exception e) {
            System.err.println("Lỗi parse JSON description: " + e.getMessage());
            return new DescriptionDTO();
        }
    }

    private FeaturesDTO buildFeatures(PropertyEntity entity) {
        FeaturesDTO features = new FeaturesDTO();
        features.setLeft(List.of(
                new FeatureItemDTO("Khoảng giá", formatPrice(entity.getPrice().longValue())),
                new FeatureItemDTO("Diện tích", entity.getArea() + " m²"),
                new FeatureItemDTO("Hướng nhà", entity.getDirection())
        ));
        features.setRight(List.of(
                new FeatureItemDTO("Pháp lý", entity.getLegalStatus())
        ));
        return features;
    }

    private List<MapMetaDTO> buildMapMeta(PropertyEntity entity) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return List.of(
                new MapMetaDTO("Ngày đăng", entity.getPostedAt().toLocalDateTime().format(formatter)),
                new MapMetaDTO("Ngày hết hạn", entity.getExpiresAt() != null ? entity.getExpiresAt().toLocalDateTime().format(formatter) : "N/A"),
                new MapMetaDTO("Loại tin", entity.getListingTypePolicy().getListingType().name()),
                new MapMetaDTO("Mã tin", entity.getId().toString())
        );
    }

    private AgentDetailDTO buildAgentDetail(UserEntity user) {
        AgentDetailDTO agent = new AgentDetailDTO();
        agent.setName(user.getFirstName() + " " + user.getLastName());
        agent.setAvatar(user.getAvatar());
        agent.setPhoneFull(user.getPhone());
        agent.setPhoneMasked(user.getPhone() != null && user.getPhone().length() > 6 ? user.getPhone().substring(0, 7) + " ***" : "N/A");
        // TODO: Cần query DB để lấy số tin đăng khác của user này
        agent.setOtherPostsText("Xem thêm 10 tin khác");
        // TODO: Dữ liệu tag nên được lưu trong DB
        agent.setTags(List.of("Chính chủ", "Đã xác thực"));
        return agent;
    }

    private String formatShortAddress(PropertyEntity entity) {
        if (entity.getDistrict() != null && entity.getCity() != null) {
            return entity.getDistrict().getName() + ", " + entity.getCity().getName();
        }
        return "N/A";
    }

    private String formatFullAddress(PropertyEntity entity) {
        StringBuilder builder = new StringBuilder();
        if (entity.getAddressStreet() != null && !entity.getAddressStreet().isEmpty()) {
            builder.append(entity.getAddressStreet()).append(", ");
        }
        if (entity.getWard() != null) {
            builder.append(entity.getWard().getName()).append(", ");
        }
        if (entity.getDistrict() != null) {
            builder.append(entity.getDistrict().getName()).append(", ");
        }
        if (entity.getCity() != null) {
            builder.append(entity.getCity().getName());
        }
        return builder.toString();
    }

    private String formatPrice(long price) {
        if (price >= 1_000_000_000) {
            return String.format(Locale.US, "%.1f tỷ", price / 1_000_000_000.0).replace(".0", "");
        }
        if (price >= 1_000_000) {
            return String.format("%d triệu", price / 1_000_000);
        }
        return NumberFormat.getNumberInstance(new Locale("vi", "VN")).format(price) + " đ";
    }

    private String formatRelativeTime(Timestamp timestamp) {
        if (timestamp == null) return "";
        Duration duration = Duration.between(timestamp.toInstant(), Instant.now());
        long days = duration.toDays();
        if (days >= 30) return (days / 30) + " tháng trước";
        if (days >= 7) return (days / 7) + " tuần trước";
        if (days > 0) return days + " ngày trước";
        long hours = duration.toHours();
        if (hours > 0) return hours + " giờ trước";
        long minutes = duration.toMinutes();
        if (minutes > 0) return minutes + " phút trước";
        return "Vừa xong";
    }
}