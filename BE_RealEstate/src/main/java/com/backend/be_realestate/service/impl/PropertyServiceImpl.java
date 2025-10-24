package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.converter.PropertyMapper;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.*;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.propertyEvent.PropertyEvent;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.repository.specification.PropertySpecification;
import com.backend.be_realestate.service.IPropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyServiceImpl implements IPropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;
    private final PropertyConverter propertyConverter;
    private final PropertyImage propertyImageRepository;
    private final AmenityRepository amenityRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;
    private final UserRepository userRepository;
    private final ListingTypePolicyRepository policyRepo;
    private final UserInventoryRepository inventoryRepo;
    private final ApplicationEventPublisher publisher;
    private final NotificationServiceImpl notificationService;

    @Override
    public List<PropertyCardDTO> getAllPropertiesForCardView() {
        return propertyRepository.findAll().stream()
                .map(propertyMapper::toPropertyCardDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PropertyDetailDTO getPropertyDetailById(Long id, Long currentUserId, boolean preview) {
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));

        if (!preview) {
            Long authorId = (entity.getUser() != null) ? entity.getUser().getUserId() : null;
            if (currentUserId == null || !currentUserId.equals(authorId)) {
                propertyRepository.bumpView(id);                // UPDATE view_count = view_count + 1
                entity.setViewCount(entity.getViewCount() + 1); // đồng bộ giá trị trả về (tuỳ chọn)
            }
        }
        return propertyMapper.toPropertyDetailDTO(entity);
    }

    @Override
    @Transactional
    public PropertyDetailDTO getPropertyDetailById(Long id) {
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
        return propertyMapper.toPropertyDetailDTO(entity);
    }

    @Override
    public Page<PropertyCardDTO> searchProperties(Map<String, String> params) {
        // --- 1. XỬ LÝ PHÂN TRANG VÀ SẮP XẾP ---
        Pageable pageable = createPageableFromParams(params);

        // --- 2. LẤY CÁC GIÁ TRỊ LỌC TỪ PARAMS ---
        String keyword = params.get("keyword");
        String propertyType = params.get("type");
        String categorySlug = params.get("category");
        Double priceFrom = params.get("priceFrom") != null ? Double.parseDouble(params.get("priceFrom")) : null;
        Double priceTo = params.get("priceTo") != null ? Double.parseDouble(params.get("priceTo")) : null;
        Float areaFrom = params.get("areaFrom") != null ? Float.parseFloat(params.get("areaFrom")) : null;
        Float areaTo = params.get("areaTo") != null ? Float.parseFloat(params.get("areaTo")) : null;
        // Thêm các tham số khác nếu cần...

        // --- 3. KẾT HỢP CÁC SPECIFICATION ---
        Specification<PropertyEntity> spec = PropertySpecification.hasKeyword(keyword)
                .and(PropertySpecification.hasPropertyType(propertyType))
                .and(PropertySpecification.hasCategorySlug(categorySlug))
                .and(PropertySpecification.priceBetween(priceFrom, priceTo))
                .and(PropertySpecification.areaBetween(areaFrom, areaTo));
        // .and(...) thêm các điều kiện khác

        // --- 4. GỌI REPOSITORY VÀ MAP KẾT QUẢ ---
        Page<PropertyEntity> resultPage = propertyRepository.findAll(spec, pageable);
        return resultPage.map(propertyMapper::toPropertyCardDTO);
    }

    // Phương thức phụ trợ để code gọn gàng hơn
    private Pageable createPageableFromParams(Map<String, String> params) {
        int page = Integer.parseInt(params.getOrDefault("page", "0"));
        int size = Integer.parseInt(params.getOrDefault("size", "10"));
        String[] sortParams = params.getOrDefault("sort", "postedAt,desc").split(",");
        Sort sort = Sort.by(Sort.Direction.fromString(sortParams[1].toUpperCase()), sortParams[0]);
        return PageRequest.of(page, size, sort);
    }

    @Override
    public Page<PropertyDTO> getPropertiesByUser(Long userId, Pageable pageable) {
        return propertyRepository.findAllByUser_UserId(userId, pageable)
                .map(propertyConverter::toDto);
    }

    @Override
    public PropertyDTO create1(Long currentUserId, CreatePropertyRequest req, List<MultipartFile> images) {
        return null;
    }

    @Override
    @Transactional
    public CreatePropertyResponse create(Long userId, CreatePropertyRequest req) {
        var policy = policyRepo.findById(req.getListingTypePolicyId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid listingTypePolicyId"));

        if (policy.getIsActive() == null || policy.getIsActive() == 0L) {
            throw new IllegalStateException("Listing type is inactive");
        }

//        // Kiểm tra & trừ tồn kho nếu VIP/PREMIUM
//        var type = policy.getListingType(); // NORMAL / VIP / PREMIUM
//        if (type != ListingType.NORMAL) {
//            // dùng khoá bi quan để tránh race condition (khuyên dùng), hoặc optimistic lock với @Version
//            UserInventoryEntity inv = inventoryRepo.lockByUserAndType(userId, type.name())
//                    .orElseGet(() -> inventoryRepo.findByUser_UserIdAndItemType(userId, type.name())
//                            .orElseThrow(() -> new IllegalStateException("Inventory not found")));
//            if (inv.getQuantity() == null || inv.getQuantity() <= 0) {
//                throw new OutOfStockException(type.name());
//            }
//            inv.setQuantity(inv.getQuantity() - 1);
//            inventoryRepo.save(inv);
//        }

        var property = new PropertyEntity();

        // --- SỬA LẠI CHỖ NÀY ---
        // Chúng ta cần UserEntity THẬT, không phải proxy
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID: " + userId));
        property.setUser(user);
        // --- KẾT THÚC SỬA ---

        if (req.getCategoryId() != null) {
            property.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid categoryId")));
        }
        if (req.getCityId() != null) property.setCity(cityRepository.findById(req.getCityId()).orElse(null));
        if (req.getDistrictId() != null) property.setDistrict(districtRepository.findById(req.getDistrictId()).orElse(null));
        if (req.getWardId() != null) property.setWard(wardRepository.findById(req.getWardId()).orElse(null));
        property.setListingTypePolicy(policy);
        property.setListingType(policy.getListingType());

        // Trường cơ bản
        property.setTitle(req.getTitle());
        property.setPrice(req.getPrice());
        // ... (Tất cả các trường .set... khác của bạn giữ nguyên) ...
        property.setArea(req.getArea());
        property.setLandArea(req.getLandArea());
        property.setBedrooms(req.getBedrooms());
        property.setBathrooms(req.getBathrooms());
        property.setAddressStreet(req.getAddressStreet());
        property.setDisplayAddress(req.getDisplayAddress());
        property.setPosition(req.getPosition());
        property.setLegalStatus(req.getLegalStatus());
        property.setDirection(req.getDirection());
        property.setDescription(req.getDescription());
        property.setFloors(req.getFloors());
        property.setWidth(req.getWidth());
        property.setHeight(req.getHeight());


        // Enum nếu FE gửi string
        if (req.getPropertyType() != null) {
            property.setPropertyType(PropertyType.valueOf(req.getPropertyType().name()));
        }
        if (req.getPriceType() != null) {
            property.setPriceType(PriceType.valueOf(req.getPriceType().name()));
        }

        // Status
        property.setStatus(PropertyStatus.PENDING_REVIEW);

        // Ảnh
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            var imgs = req.getImageUrls().stream().map(url -> {
                var img = new PropertyImageEntity();
                img.setProperty(property);
                img.setImageUrl(url);
                return img;
            }).toList();
            property.setImages(imgs);
        }

        // Tiện ích
        if (req.getAmenityIds() != null && !req.getAmenityIds().isEmpty()) {
            var amenities = amenityRepository.findAllById(req.getAmenityIds());
            property.setAmenities(amenities);
        }

        // === LƯU PROPERTY ===
        var saved = propertyRepository.save(property);

        // === BỎ EVENT LISTENER ===
        // publisher.publishEvent(new PropertyEvent( ... )); // <-- BỎ DÒNG NÀY

        // +++ THÊM LOGIC NOTIFICATION TRỰC TIẾP VÀO ĐÂY +++

        // Chỉ gửi thông báo nếu tin ở trạng thái PENDING_REVIEW
        if (saved.getStatus() == PropertyStatus.PENDING_REVIEW) {
            log.info("[PropertyService] Tin đăng {} đã lưu, đang gửi thông báo...", saved.getId());
            try {
                String title = saved.getTitle() != null ? saved.getTitle() : "không có tiêu đề";

                // --- 1. GỬI THÔNG BÁO CHO ADMIN ---
                List<UserEntity> admins = userRepository.findAllByRoles_Code("ADMIN");
                if (admins.isEmpty()) {
                    log.warn("[PropertyService] Không tìm thấy ADMIN để gửi thông báo.");
                } else {
                    String adminMessage = String.format("Tin đăng mới '%s' (ID: %d) đang chờ duyệt.", title, saved.getId());
                    String adminLink = "/admin/posts";

                    for (UserEntity admin : admins) {
                        notificationService.createNotification(
                                admin,
                                NotificationType.NEW_LISTING_PENDING,
                                adminMessage,
                                adminLink
                        );
                    }
                    log.info("[PropertyService] Đã gửi thông báo NEW_LISTING_PENDING cho {} admin.", admins.size());
                }

                // --- 2. GỬI THÔNG BÁO CHO NGƯỜI ĐĂNG (AUTHOR) ---
                String userMessage = String.format("Tin đăng '%s' của bạn đã được gửi và đang chờ duyệt.", title);
                String userLink = "/dashboard/posts?tab=pending";

                notificationService.createNotification(
                        saved.getUser(), // Lấy user ID từ property đã lưu
                        NotificationType.LISTING_PENDING_USER,
                        userMessage,
                        userLink
                );
                log.info("[PropertyService] Đã gửi thông báo LISTING_PENDING_USER cho user {}.", saved.getUser().getUserId());

            } catch (Exception e) {
                // Rất quan trọng: Bắt lỗi để nếu gửi noti lỗi, nó KHÔNG làm rollback việc tạo tin đăng
                log.error("!!!!!!!!!!!! LỖI NGHIÊM TRỌNG KHI GỬI NOTIFICATION (nhưng tin đăng đã tạo thành công): {}", e.getMessage(), e);
            }
        }
        // +++ KẾT THÚC PHẦN THÊM MỚI +++

        return new CreatePropertyResponse(saved.getId(), saved.getStatus());
    }

    @Override
    public Page<PropertyDTO> getPropertiesByUser(Long userId, String status, Pageable pageable) {

        // 1. Luôn lọc theo user ID
        Specification<PropertyEntity> userSpec = (root, query, cb) ->
                cb.equal(root.get("user").get("userId"), userId);

        Specification<PropertyEntity> statusSpec;

        // 2. Lọc status dựa trên logic map (ánh xạ) của frontend
        if (status != null) {
            String statusKey = status.toLowerCase();

            if (statusKey.equals("active")) {
                // Frontend key "active" = PUBLISHED của BE
                statusSpec = (root, query, cb) -> cb.equal(root.get("status"), PropertyStatus.PUBLISHED);

            } else if (statusKey.equals("pending")) {
                statusSpec = (root, query, cb) -> cb.equal(root.get("status"), PropertyStatus.PENDING_REVIEW);

            } else if (statusKey.equals("draft")) {
                // Frontend key "draft" = DRAFT HOẶC ACTIVE của BE
                statusSpec = (root, query, cb) -> cb.or(
                        cb.equal(root.get("status"), PropertyStatus.DRAFT),
                        cb.equal(root.get("status"), PropertyStatus.ACTIVE)
                );

            } else if (statusKey.equals("hidden")) {
                // Frontend key "hidden" = HIDDEN HOẶC ARCHIVED của BE
                statusSpec = (root, query, cb) -> cb.or(
                        cb.equal(root.get("status"), PropertyStatus.HIDDEN),
                        cb.equal(root.get("status"), PropertyStatus.ARCHIVED)
                );

            } else {
                // Các trường hợp 1-1 còn lại (REJECTED, EXPIRED, v.v.)
                PropertyStatus mappedStatus = mapFrontendStatus(statusKey);
                if (mappedStatus != null) {
                    statusSpec = (root, query, cb) -> cb.equal(root.get("status"), mappedStatus);
                } else {
                    statusSpec = (root, query, cb) -> cb.conjunction(); // Không lọc nếu key lạ
                }
            }

        } else {
            // Không lọc status nếu status = null (cho API cũ)
            statusSpec = (root, query, cb) -> cb.conjunction(); // (Điều kiện luôn đúng)
        }

        // 3. Kết hợp điều kiện
        Specification<PropertyEntity> finalSpec = userSpec.and(statusSpec);

        // 4. Gọi Repository và trả về
        return propertyRepository.findAll(finalSpec, pageable)
                .map(propertyConverter::toDto);
    }

    @Override
    public Map<String, Long> getPropertyCountsByStatus(Long userId) {
        // 1. Khởi tạo Map kết quả với tất cả các key = 0
        Map<String, Long> counts = new HashMap<>();
        counts.put("active", 0L);
        counts.put("pending", 0L);
        counts.put("draft", 0L);
        counts.put("rejected", 0L);
        counts.put("hidden", 0L);
        counts.put("expired", 0L);
        counts.put("expiringSoon", 0L);

        // 2. Gọi query GROUP BY từ Repository
        List<IPropertyCount> results = propertyRepository.countByStatus(userId);

        // 3. Duyệt qua kết quả từ CSDL và map vào Map
        for (IPropertyCount item : results) {
            String frontendKey = mapBackendStatusToFrontendKey(item.getStatus());
            if (frontendKey != null) {
                // Ghi đè số 0 bằng số đếm thật
                counts.put(frontendKey, item.getCount());
            }
        }

        return counts;
    }

    // +++ THÊM HÀM TRỢ GIÚP ÁNH XẠ NGƯỢC +++
    private String mapBackendStatusToFrontendKey(PropertyStatus beStatus) {
        if (beStatus == null) return null;

        switch (beStatus) {
            case PUBLISHED:
                return "active";
            case PENDING_REVIEW:
                return "pending";
            case DRAFT:
            case ACTIVE: // Gộp cả ACTIVE (nếu có) vào "draft" theo logic slice
                return "draft";
            case REJECTED:
                return "rejected";
            case HIDDEN:
            case ARCHIVED: // Gộp cả ARCHIVED vào "hidden" theo logic slice
                return "hidden";
            case EXPIRED:
                return "expired";
            case EXPIRINGSOON:
                return "expiringSoon";
            default:
                return null;
        }
    }

    // =============================================================
    // +++ HÀM TRỢ GIÚP (ĐÃ SỬA) +++
    // =============================================================
    private PropertyStatus mapFrontendStatus(String statusKey) {
        // Chỉ map các trường 1-1 đơn giản
        // (Các trường phức tạp 'active', 'draft', 'hidden' đã được xử lý ở trên)
        switch (statusKey) {
            case "rejected":
                return PropertyStatus.REJECTED;
            case "expired":
                return PropertyStatus.EXPIRED;
            case "expiringsoon":
                return PropertyStatus.EXPIRINGSOON;
            default:
                return null;
        }
    }

}
