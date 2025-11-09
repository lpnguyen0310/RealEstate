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
        dto.setDescription(entity.getDescription());
        dto.setListing_type(entity.getListingType().name());
        dto.setBed(entity.getBedrooms() != null ? entity.getBedrooms() : 0);
        dto.setBath(entity.getBathrooms() != null ? entity.getBathrooms() : 0);
        dto.setViewCount(entity.getViewCount() != null ? entity.getViewCount() : 0);
        dto.setStatus(entity.getStatus());
        // === THAY ĐỔI 1: Thêm trường price đã được định dạng ===
        if (entity.getPrice() != null) {
            dto.setPrice(formatPrice(entity.getPrice().longValue()));
        }

        double price = entity.getPrice();
        float area = entity.getArea();
        if (price > 0 && area > 0) {
            double pricePerM2 = price / area;
            dto.setPricePerM2(formatPricePerM2(pricePerM2));
        }

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
        // === THAY ĐỔI 2: Lấy địa chỉ đầy đủ trực tiếp từ display_address ===
        dto.setAddressFull(entity.getDisplayAddress());

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
        dto.setViewCount(entity.getViewCount() == null ? 0 : entity.getViewCount());

        MapDTO mapDTO = new MapDTO();
        dto.setMap(mapDTO);

        dto.setMapMeta(buildMapMeta(entity));
//        dto.setAgent(buildAgentDetail(entity.getUser()));
        dto.setAgent(buildAgentDetail(entity)); // <-- đổi sang gọi bản mới

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
        // Lấy địa chỉ từ display_address cho cả DTO chi tiết
        postInfo.setAddress(entity.getDisplayAddress());

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
                new MapMetaDTO("Mã tin", entity.getId().toString()),
                new MapMetaDTO("Lượt xem", String.valueOf(entity.getViewCount() == null ? 0 : entity.getViewCount()))

        );
    }
    private String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return "N/A";
        if (phone.length() <= 4) return "****";
        int keep = Math.min(3, phone.length() - 4);          // ví dụ giữ 3 số đầu
        String head = phone.substring(0, keep);
        return head + " " + "*".repeat(Math.max(0, phone.length() - keep));
    }

    private AgentDetailDTO buildAgentDetail(PropertyEntity p) {
        UserEntity u = p.getUser();

        AgentDetailDTO agent = new AgentDetailDTO();
        String name = (u != null)
                ? ((u.getFirstName() + " " + u.getLastName()).trim())
                : "Người đăng";
        String avatar = (u != null) ? u.getAvatar() : null;
        String phone  = (u != null) ? u.getPhone()  : null;
        String email  = (u != null) ? u.getEmail()  : null;

        agent.setName(name);
        agent.setAvatar(avatar);
        agent.setPhoneFull(phone);
        agent.setPhoneMasked(maskPhone(phone));
        agent.setEmail(email);

        boolean isOwner = Boolean.TRUE.equals(p.getIsOwner());
        agent.setIsOwner(isOwner);
        agent.setTags(isOwner ? List.of("Chính chủ", "Đã xác thực")
                : List.of("Không phải chính chủ"));

        agent.setOtherPostsText("Xem thêm 10 tin khác");
        return agent;
    }

    // Nếu nơi khác vẫn đang gọi bản cũ: giữ overload cũ và gọi qua bản mới
    @Deprecated
    private AgentDetailDTO buildAgentDetail(UserEntity user) {
        PropertyEntity fake = new PropertyEntity();
        fake.setUser(user);
        fake.setIsOwner(Boolean.TRUE);
        if (user != null) {
            fake.setContactName((user.getFirstName() + " " + user.getLastName()).trim());
            fake.setContactPhone(user.getPhone());
            fake.setContactEmail(user.getEmail());
        }
        return buildAgentDetail(fake);
    }

    private String formatShortAddress(PropertyEntity entity) {
        if (entity.getDistrict() != null && entity.getCity() != null) {
            return entity.getDistrict().getName() + ", " + entity.getCity().getName();
        }
        return "N/A";
    }

    // Phương thức này không còn được sử dụng cho addressFull trong PropertyCardDTO nữa
    // private String formatFullAddress(PropertyEntity entity) { ... }

    private String formatPrice(long price) {
        if (price >= 1_000_000_000) {
            // Sử dụng %.2f để hiển thị đẹp hơn cho các số lẻ, ví dụ 2.5 tỷ
            return String.format(Locale.US, "%.2f tỷ", price / 1_000_000_000.0).replaceAll("\\.00|\\.0$", "");
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

    private String formatPricePerM2(double pricePerM2) {
        if (pricePerM2 >= 1_000_000) {
            // Làm tròn đến 1 chữ số thập phân, ví dụ: "25.5 triệu/m²"
            return String.format(Locale.US, "%.1f triệu/m²", pricePerM2 / 1_000_000.0);
        }
        if (pricePerM2 >= 1_000) {
            return String.format("%d nghìn/m²", Math.round(pricePerM2 / 1_000));
        }
        // Trả về số gốc nếu quá nhỏ
        return NumberFormat.getNumberInstance(new Locale("vi", "VN")).format(pricePerM2) + " đ/m²";
    }
}