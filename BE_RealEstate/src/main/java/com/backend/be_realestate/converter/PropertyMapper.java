package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.modals.dto.AgentDTO;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.detail.*;
import com.backend.be_realestate.repository.PotentialCustomerRepository;
import com.backend.be_realestate.repository.PropertyActivityLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper; // Giữ lại import này, có thể bạn dùng ở chỗ khác
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList; // Thêm import này
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PropertyMapper {

    // Giữ lại ObjectMapper, có thể bạn cần dùng cho logic khác
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PropertyActivityLogRepository activityLogRepo;
    private final PotentialCustomerRepository potentialCustomerRepo;

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
    // MAPPER CHO DETAIL VIEW (PHẦN ĐÃ SỬA)
    // =================================================================================

    public PropertyDetailDTO toPropertyDetailDTO(PropertyEntity entity) {
        if (entity == null) return null;

        PropertyDetailDTO dto = new PropertyDetailDTO();
        Long propertyId = entity.getId();

        dto.setGallery(entity.getImages().stream()
                .sorted(Comparator.comparing(PropertyImageEntity::getDisplayOrder))
                .map(PropertyImageEntity::getImageUrl)
                .collect(Collectors.toList()));

        dto.setPostInfo(buildPostInfo(entity)); // Gọi hàm đã sửa
        dto.setFeatures(buildFeatures(entity)); // Gọi hàm đã sửa
        dto.setViewCount(entity.getViewCount() == null ? 0 : entity.getViewCount());

        // === FIX 1: THÊM LOGIC MAP DESCRIPTION ===
        dto.setDescription(buildDescriptionFromString(entity.getDescription()));

        MapDTO mapDTO = new MapDTO();
        // TODO: Thêm logic lấy Lat/Lng cho bản đồ
        // mapDTO.setLat(entity.getLatitude());
        // mapDTO.setLng(entity.getLongitude());
        dto.setMap(mapDTO);

        dto.setMapMeta(buildMapMeta(entity));
//        dto.setAgent(buildAgentDetail(entity.getUser()));
        dto.setAgent(buildAgentDetail(entity)); // <-- đổi sang gọi bản mới

        // Logic tính toán (giữ nguyên)
        Long favoriteCount = (entity.getFavoriteCount() != null) ? entity.getFavoriteCount() : 0L;
        Long totalInteractions = activityLogRepo.countByPropertyIdAndActivityTypeIn(
                propertyId,
                List.of(ActivityType.SHARE, ActivityType.FAVORITE) // Đếm 2 sự kiện này
        );
        dto.setInteractionCount(totalInteractions);

        // 2. Khách tiềm năng (Event) - Đếm TỔNG SỐ LẦN "View Phone", "Zalo" và "Form"
        // Phép tính này vẫn đúng vì nó đếm tất cả trong bảng PotentialCustomer
        Long leadCount = potentialCustomerRepo.countByPropertyId(propertyId);
        dto.setPotentialCustomerCount(leadCount);

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

    // === FIX 2: SỬA LẠI buildPostInfo ===
    private PostInfoDTO buildPostInfo(PropertyEntity entity) {
        PostInfoDTO postInfo = new PostInfoDTO();
        postInfo.setTitle(entity.getTitle());
        postInfo.setAddress(entity.getDisplayAddress());

        StatsDTO stats = new StatsDTO();
        stats.setPriceText(formatPrice(entity.getPrice().longValue()));
        stats.setAreaText(entity.getArea() + " m²");

        // Bổ sung các trường stats còn thiếu
        double price = entity.getPrice();
        float area = entity.getArea();
        if (price > 0 && area > 0) {
            stats.setPricePerM2(formatPricePerM2(price / area));
        }

        if (entity.getWidth() != null && entity.getWidth() > 0) {
            stats.setFrontageText("Mặt tiền " + entity.getWidth() + " m");
        }

        postInfo.setStats(stats);

        // TODO: Logic tính toán tăng trưởng giá thực tế từ bảng PriceHistoryEntity
        GrowthNoticeDTO growth = new GrowthNoticeDTO();
        growth.setText("+ 5% · Giá ổn định");
        growth.setCta("Xem lịch sử giá ›");
        postInfo.setGrowthNotice(growth);

        return postInfo;
    }

    // === FIX 3: XÓA buildDescription (cũ) VÀ THAY BẰNG buildDescriptionFromString ===
    /**
     * Hàm mới: Parse String từ DB sang DescriptionDTO
     * Quy ước: Dòng đầu tiên là headline, các dòng sau là bullets
     */
    private DescriptionDTO buildDescriptionFromString(String dbDescription) {
        DescriptionDTO descDto = new DescriptionDTO();

        // Luôn khởi tạo mảng rỗng để FE không bị crash
        descDto.setBullets(Collections.emptyList());
        descDto.setNearby(Collections.emptyList());

        if (dbDescription == null || dbDescription.trim().isEmpty()) {
            descDto.setHeadline("Chưa có thông tin mô tả.");
            // Bạn có thể set các trường khác là "" hoặc null tùy ý FE
            descDto.setNearbyTitle("");
            descDto.setPriceLine("");
            descDto.setSuggest("");
            return descDto;
        }

        // Tách chuỗi bằng dấu xuống dòng (hỗ trợ cả Windows \r\n và Unix \n)
        String[] lines = dbDescription.split("\\r?\\n");

        if (lines.length > 0) {
            // Dòng đầu tiên là headline
            descDto.setHeadline(lines[0].trim());
        }

        if (lines.length > 1) {
            // Các dòng còn lại là bullets
            List<String> bullets = new ArrayList<>();
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (!line.isEmpty()) { // Bỏ qua các dòng trống
                    bullets.add(line);
                }
            }
            descDto.setBullets(bullets);
        }

        // TODO: Thêm logic cho nearbyTitle, nearby, priceLine, suggest nếu cần
        // Ví dụ:
        // descDto.setNearbyTitle("Tiện ích lân cận:");
        // descDto.setNearby(List.of("Gần chợ", "Gần trường học"));
        // descDto.setPriceLine("Giá: " + formatPrice(entity.getPrice().longValue()));
        // descDto.setSuggest("Liên hệ ngay để xem nhà!");

        return descDto;
    }

    // === FIX 4: SỬA LẠI buildFeatures ===
    /**
     * Sửa lại hàm buildFeatures để lấy nhiều trường hơn từ Entity
     * và tự động ẩn các trường nếu không có dữ liệu.
     */
    private FeaturesDTO buildFeatures(PropertyEntity entity) {
        FeaturesDTO features = new FeaturesDTO();

        // Dùng ArrayList để có thể thêm/bớt động
        List<FeatureItemDTO> left = new ArrayList<>();
        List<FeatureItemDTO> right = new ArrayList<>();

        // === CỘT TRÁI ===
        left.add(new FeatureItemDTO("Khoảng giá", formatPrice(entity.getPrice().longValue())));
        left.add(new FeatureItemDTO("Diện tích", entity.getArea() + " m²"));

        if (entity.getBedrooms() != null && entity.getBedrooms() > 0) {
            left.add(new FeatureItemDTO("Phòng ngủ", entity.getBedrooms() + " phòng"));
        }
        if (entity.getLandArea() != null && entity.getLandArea() > 0) {
            left.add(new FeatureItemDTO("Diện tích đất", entity.getLandArea() + " m²"));
        }
        if (entity.getWidth() != null && entity.getWidth() > 0 && entity.getHeight() != null && entity.getHeight() > 0) {
            left.add(new FeatureItemDTO("Ngang x Dài", entity.getWidth() + "m x " + entity.getHeight() + "m"));
        }

        // === CỘT PHẢI ===
        if (entity.getLegalStatus() != null && !entity.getLegalStatus().isEmpty()) {
            right.add(new FeatureItemDTO("Pháp lý", entity.getLegalStatus()));
        }

        // Fix: Hiển thị "---" nếu Hướng nhà rỗng
        if (entity.getDirection() != null && !entity.getDirection().isEmpty()) {
            right.add(new FeatureItemDTO("Hướng nhà", entity.getDirection()));
        } else {
            right.add(new FeatureItemDTO("Hướng nhà", "---"));
        }

        if (entity.getBathrooms() != null && entity.getBathrooms() > 0) {
            right.add(new FeatureItemDTO("Phòng tắm", entity.getBathrooms() + " phòng"));
        }
        if (entity.getFloors() != null && entity.getFloors() > 0) {
            right.add(new FeatureItemDTO("Số tầng", entity.getFloors() + " tầng"));
        }
        if (entity.getPosition() != null && !entity.getPosition().isEmpty()) {
            right.add(new FeatureItemDTO("Vị trí", entity.getPosition()));
        }

        features.setLeft(left);
        features.setRight(right);
        return features;
    }

    // === CÁC HÀM CÒN LẠI GIỮ NGUYÊN ===

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