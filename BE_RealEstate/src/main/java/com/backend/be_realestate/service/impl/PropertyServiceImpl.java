            package com.backend.be_realestate.service.impl;

            import com.backend.be_realestate.converter.PropertyConverter;
            import com.backend.be_realestate.converter.PropertyMapper;
            import com.backend.be_realestate.converter.UserConverter;
            import com.backend.be_realestate.entity.*;
            import com.backend.be_realestate.enums.*;
            import com.backend.be_realestate.exceptions.OutOfStockException;
            import com.backend.be_realestate.exceptions.ResourceNotFoundException;
            import com.backend.be_realestate.modals.RecoResult;
            import com.backend.be_realestate.modals.ai.ScoredProperty;
            import com.backend.be_realestate.modals.ai.UserPreference;
            import com.backend.be_realestate.modals.dto.PropertyCardDTO;
            import com.backend.be_realestate.modals.dto.PropertyDTO;
            import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
            import com.backend.be_realestate.modals.dto.UserFavoriteDTO;
            import com.backend.be_realestate.modals.dto.propertyEvent.PropertyEvent;
            import com.backend.be_realestate.modals.dto.propertydashboard.PendingPropertyDTO;
            import com.backend.be_realestate.modals.request.CreatePropertyRequest;
            import com.backend.be_realestate.modals.response.CreatePropertyResponse;
            import com.backend.be_realestate.modals.response.PageResponse;
            import com.backend.be_realestate.modals.response.PropertyActionResponse;
            import com.backend.be_realestate.modals.response.admin.PropertyKpiResponse;
            import com.backend.be_realestate.repository.*;
            import com.backend.be_realestate.repository.specification.PropertySpecification;
            import com.backend.be_realestate.service.IAIService;
            import com.backend.be_realestate.service.IPropertyService;
            import com.backend.be_realestate.service.IPropertyTrackingService;
            import com.backend.be_realestate.utils.RecommendationSpec;
            import io.micrometer.common.lang.Nullable;
            import jakarta.persistence.EntityNotFoundException;
            import jakarta.persistence.criteria.From;
            import jakarta.persistence.criteria.Join;
            import jakarta.persistence.criteria.JoinType;
            import jakarta.persistence.criteria.Predicate;
            import jakarta.servlet.http.HttpServletRequest;
            import lombok.RequiredArgsConstructor;
            import lombok.extern.slf4j.Slf4j;
            import org.slf4j.Logger;
            import org.slf4j.LoggerFactory;
            import org.springframework.context.ApplicationEventPublisher;
            import org.springframework.data.domain.*;
            import org.springframework.data.jpa.domain.Specification;
            import org.springframework.messaging.simp.SimpMessagingTemplate;
            import org.springframework.scheduling.annotation.Scheduled;
            import org.springframework.security.access.AccessDeniedException;
            import org.springframework.stereotype.Service;
            import org.springframework.transaction.annotation.Transactional;
            import org.springframework.web.multipart.MultipartFile;

            import java.sql.Timestamp;
            import java.time.*;
            import java.util.*;
            import java.util.stream.Collectors;

            import static org.springframework.data.domain.Sort.Direction.DESC;

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
                private final SavedPropertyRepository savedPropertyRepository;
                private final UserConverter userConverter;
                private final SimpMessagingTemplate messagingTemplate;
                private final IAIService aiService;
                private static final ZoneId ZONE_VN = ZoneId.of("Asia/Ho_Chi_Minh");
                private static final String TZ_OFFSET = "+07:00";
                private final IPropertyTrackingService trackingService;
                private final HttpServletRequest request;

                /* =========================================================
                 * PUBLIC LIST / SEARCH (HOME)
                 * ========================================================= */
                @Override
                public List<PropertyCardDTO> getAllPropertiesForCardView() {
                    return propertyRepository.findAll().stream()
                            .map(propertyMapper::toPropertyCardDTO)
                            .collect(Collectors.toList());
                }

                @Override
                public Page<PropertyCardDTO> searchProperties(Map<String, String> params) {
                    Pageable pageable = createPageableFromParams(params);

                    String keyword      = params.get("keyword");
                    String propertyType = params.get("type");
                    String categorySlug = params.get("category");
                    Double priceFrom    = params.get("priceFrom") != null ? Double.parseDouble(params.get("priceFrom")) : null;
                    Double priceTo      = params.get("priceTo")   != null ? Double.parseDouble(params.get("priceTo"))   : null;
                    Float areaFrom      = params.get("areaFrom")  != null ? Float.parseFloat(params.get("areaFrom"))    : null;
                    Float areaTo        = params.get("areaTo")    != null ? Float.parseFloat(params.get("areaTo"))      : null;
                    Long cityId         = params.get("cityId")    != null ? Long.parseLong(params.get("cityId"))        : null;

                    // 🔹 MỚI: phòng ngủ, phòng tắm, pháp lý, tiện ích
                    Integer bedroomsFrom  = params.get("bedroomsFrom")  != null ? Integer.parseInt(params.get("bedroomsFrom"))  : null;
                    Integer bathroomsFrom = params.get("bathroomsFrom") != null ? Integer.parseInt(params.get("bathroomsFrom")) : null;
                    String legalType      = params.get("legalType"); // "Sổ hồng" / "Sổ đỏ" ...

                    List<Long> amenityIds = null;
                    String amenitiesRaw = params.get("amenities"); // VD: "1,3,5"
                    if (amenitiesRaw != null && !amenitiesRaw.isBlank()) {
                        amenityIds = Arrays.stream(amenitiesRaw.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .map(Long::parseLong)
                                .toList();
                    }

                    boolean matchAll = !"any".equalsIgnoreCase(params.getOrDefault("kwMode", "all"));

                    Specification<PropertyEntity> spec = Specification
                            .where(PropertySpecification.isPublished())
                            .and(PropertySpecification.notExpired()); // optional: lọc tin hết hạn
                    List<String> directions = null;
                    String directionsRaw = params.get("directions"); // "Tây - Bắc,Đông"
                    if (directionsRaw != null && !directionsRaw.isBlank()) {
                        directions = Arrays.stream(directionsRaw.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList();
                    }

                    List<String> positions = null;
                    String positionsRaw = params.get("positions");
                    if (positionsRaw != null && !positionsRaw.isBlank()) {
                        positions = Arrays.stream(positionsRaw.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList();
                    }
                    if (cityId != null) {
                        spec = spec.and(PropertySpecification.hasCity(cityId));
                    } else {
                        spec = spec.and(PropertySpecification.hasKeyword(keyword, matchAll));
                    }

                    spec = spec
                            .and(PropertySpecification.hasPropertyType(propertyType))
                            .and(PropertySpecification.hasCategorySlug(categorySlug))
                            .and(PropertySpecification.priceBetween(priceFrom, priceTo))
                            .and(PropertySpecification.areaBetween(areaFrom, areaTo))
                            .and(PropertySpecification.hasMinBedrooms(bedroomsFrom))
                            .and(PropertySpecification.hasMinBathrooms(bathroomsFrom))
                            .and(PropertySpecification.hasLegalStatus(legalType))
                            .and(PropertySpecification.hasAnyAmenities(amenityIds))
                            .and(PropertySpecification.hasAnyDirections(directions))
                            .and(PropertySpecification.hasAnyPositions(positions));

                    Page<PropertyEntity> resultPage = propertyRepository.findAll(spec, pageable);
                    return resultPage.map(propertyMapper::toPropertyCardDTO);
                }


                private Pageable createPageableFromParams(Map<String, String> params) {
                    int page = Integer.parseInt(params.getOrDefault("page", "0"));
                    int size = Integer.parseInt(params.getOrDefault("size", "10"));
                    String[] sortParams = params.getOrDefault("sort", "postedAt,desc").split(",");
                    Sort sort = Sort.by(Sort.Direction.fromString(sortParams.length > 1 ? sortParams[1] : "desc"),
                            sortParams[0]);
                    return PageRequest.of(page, size, sort);
                }



                @Override
                @Transactional
                public PropertyDetailDTO getPropertyDetailById(Long id, Long currentUserId, boolean preview) {
                    PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));

            //        if (!preview) {
            //            Long authorId = (entity.getUser() != null) ? entity.getUser().getUserId() : null;
            //            if (currentUserId == null || !Objects.equals(currentUserId, authorId)) {
            //                propertyRepository.bumpView(id);
            //                entity.setViewCount((entity.getViewCount() == null ? 0 : entity.getViewCount()) + 1);
            //            }
            //        }
                    return propertyMapper.toPropertyDetailDTO(entity);
                }

                private String getClientIp(HttpServletRequest request) {
                    String remoteAddr = request.getHeader("X-FORWARDED-FOR");
                    if (remoteAddr == null || remoteAddr.isEmpty()) {
                        remoteAddr = request.getRemoteAddr();
                    }
                    // Lấy IP đầu tiên nếu có nhiều IP (X-FORWARDED-FOR)
                    return remoteAddr.split(",")[0].trim();
                }

                @Override
                @Transactional
                public PropertyDetailDTO getPropertyDetailById(Long id) {
                    PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
                    return propertyMapper.toPropertyDetailDTO(entity);
                }

                /* =========================================================
                 * CREATE
                 * ========================================================= */
                @Override
                public PropertyDTO create1(Long currentUserId, CreatePropertyRequest req, List<MultipartFile> images) {
                    return null; // chưa dùng
                }

                @Override
                @Transactional
                public CreatePropertyResponse create(Long userId, CreatePropertyRequest req,SubmitMode mode) {
                    var policy = policyRepo.findById(req.getListingTypePolicyId())
                            .orElseThrow(() -> new IllegalArgumentException("Invalid listingTypePolicyId"));
                    if (policy.getIsActive() == null || policy.getIsActive() == 0L) {
                        throw new IllegalStateException("Listing type is inactive");
                    }

                    var user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("Invalid user ID: " + userId));

                    var property = new PropertyEntity();
                    property.setUser(user);
                    property.setListingTypePolicy(policy);
                    property.setListingType(policy.getListingType());

                    // map field
                    applyRequestToEntity(property, req, /*createMode*/ true, /*mode*/ mode);

                    if (mode == SubmitMode.PUBLISHED) {
                        var type = policy.getListingType(); // NORMAL / VIP / PREMIUM
                        if (type != ListingType.NORMAL) {
                            UserInventoryEntity inv = inventoryRepo.lockByUserAndType(userId, type.name())
                                    .orElseGet(() -> inventoryRepo.findByUser_UserIdAndItemType(userId, type.name())
                                            .orElseThrow(() -> new IllegalStateException("Inventory not found")));

                            if (inv.getQuantity() == null || inv.getQuantity() <= 0) {
                                throw new OutOfStockException(type.name());
                            }

                            inv.setQuantity(inv.getQuantity() - 1);
                            inventoryRepo.save(inv);
                        }
                    }

                    var saved = propertyRepository.save(property);

                    // notify CHỈ khi publish → PENDING_REVIEW
                    if (mode == SubmitMode.PUBLISHED && saved.getStatus() == PropertyStatus.PENDING_REVIEW) {
                        try {
                            String title = (saved.getTitle() != null) ? saved.getTitle() : "không có tiêu đề";

                            var admins = userRepository.findAllByRoles_Code("ADMIN");
                            if (!admins.isEmpty()) {
                                String adminMessage = String.format("Tin đăng mới '%s' (ID: %d) đang chờ duyệt.", title, saved.getId());
                                String adminLink = String.format("/admin/posts?tab=pending&reviewPostId=%d", saved.getId());
                                for (UserEntity admin : admins) {
                                    notificationService.createNotification(
                                            admin, NotificationType.NEW_LISTING_PENDING, adminMessage, adminLink
                                    );
                                }
                            }

                            String userMessage = String.format("Tin đăng '%s' của bạn đã được gửi và đang chờ duyệt.", title);
                            String userLink = "/dashboard/posts?tab=pending";
                            notificationService.createNotification(
                                    saved.getUser(), NotificationType.LISTING_PENDING_USER, userMessage, userLink
                            );
                        } catch (Exception e) {
                            log.error("Notify error (listing created OK): {}", e.getMessage(), e);
                        }
                    }

                    return new CreatePropertyResponse(saved.getId(), saved.getStatus());
                }

                // src/service/impl/PropertyServiceImpl.java

                @Override
                @Transactional
                public CreatePropertyResponse update(Long userId, Long propertyId, CreatePropertyRequest req, @Nullable SubmitMode mode) {

                    // 1. TÌM PROPERTY VÀ LẤY TRẠNG THÁI GỐC
                    var property = propertyRepository.findById(propertyId)
                            .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));

                    // Lưu lại trạng thái gốc để kiểm tra xem có phải là Đăng lại (Repost) không
                    final PropertyStatus originalStatus = property.getStatus();

                    // 2. KIỂM TRA QUYỀN SỞ HỮU
                    if (property.getUser() == null || !Objects.equals(property.getUser().getUserId(), userId)) {
                        throw new AccessDeniedException("Bạn không có quyền sửa tin này");
                    }

                    // 3. CẬP NHẬT GÓI TIN (NẾU CÓ THAY ĐỔI GÓI)
                    if (req.getListingTypePolicyId() != null) {
                        var policy = policyRepo.findById(req.getListingTypePolicyId())
                                .orElseThrow(() -> new IllegalArgumentException("Invalid listingTypePolicyId"));
                        if (policy.getIsActive() == null || policy.getIsActive() == 0L) {
                            throw new IllegalStateException("Listing type is inactive");
                        }

                        // --- [BẮT ĐẦU ĐOẠN CẦN THÊM] ---
                        // Kiểm tra: Nếu loại tin mới KHÁC loại tin cũ (VD: Normal -> Premium)
                        // Hoặc đơn giản là người dùng chọn lại gói để gia hạn
                        if (property.getListingType() != policy.getListingType()) {
                            // Xóa ngày hết hạn cũ để Admin Service biết đường tính lại ngày mới
                            property.setExpiresAt(null);

                            // (Tùy chọn) Nếu muốn đẩy bài lên đầu khi nâng cấp thì uncomment dòng dưới:
                            // property.setPostedAt(Timestamp.from(Instant.now()));
                        }
                        // --- [KẾT THÚC ĐOẠN CẦN THÊM] ---

                        property.setListingTypePolicy(policy);
                        property.setListingType(policy.getListingType());
                    }

                    // 4. ÁP DỤNG CÁC TRƯỜNG CÒN LẠI TỪ REQUEST
                    applyRequestToEntity(property, req, /*createMode*/ false, /*mode*/ (mode == null ? null : mode));

                    // 5. XỬ LÝ LOGIC TRẠNG THÁI VÀ GỬI THÔNG BÁO
                    if (mode == SubmitMode.PUBLISHED) {

                        // =========================================================================
                        // 🔥 [THÊM MỚI] LOGIC ĐĂNG LẠI (REPOST) KHI TIN HẾT HẠN
                        // =========================================================================
                        if (originalStatus == PropertyStatus.EXPIRED) {
                            ListingType type = property.getListingType(); // Lấy loại tin hiện tại (đã update ở bước 3/4)

                            // 1. Kiểm tra kho gói tin
                            // (Giả sử Normal cũng cần trừ, nếu Normal free thì bạn thêm if check ở đây)
                            UserInventoryEntity inv = inventoryRepo.lockByUserAndType(userId, type.name())
                                    .orElseGet(() -> inventoryRepo.findByUser_UserIdAndItemType(userId, type.name())
                                            .orElseThrow(() -> new IllegalStateException("Bạn không có gói tin " + type.name() + " trong kho.")));

                            if (inv.getQuantity() == null || inv.getQuantity() <= 0) {
                                throw new OutOfStockException("Bạn đã hết lượt đăng tin loại " + type.name() + ". Vui lòng mua thêm.");
                            }

                            // 2. Trừ gói tin
                            inv.setQuantity(inv.getQuantity() - 1);
                            inventoryRepo.save(inv);

                            // 3. Reset thời gian hiển thị
                            // Xem như tin mới đăng ngay lúc này
                            property.setPostedAt(Timestamp.from(Instant.now()));
                            // Xóa ngày hết hạn cũ (sẽ được tính lại khi Admin duyệt bài)
                            property.setExpiresAt(null);

                            log.info("User {} reposted property {}. Deducted 1 {} package.", userId, propertyId, type);
                        }
                        // =========================================================================

                        // Luôn set về PENDING_REVIEW khi nhấn "publish"
                        property.setStatus(PropertyStatus.PENDING_REVIEW);

                        try {
                            String title = (property.getTitle() != null) ? property.getTitle() : "không có tiêu đề";

                            // 5.1 Gửi thông báo cho Admin
                            var admins = userRepository.findAllByRoles_Code("ADMIN");
                            if (!admins.isEmpty()) {

                                String adminMessage;
                                NotificationType adminNotificationType;

                                if (originalStatus == PropertyStatus.WARNED || originalStatus == PropertyStatus.REJECTED) {
                                    // Sửa từ bài bị Cảnh cáo/Từ chối
                                    adminMessage = String.format("Tin '%s' (ID: %d) vừa được sửa (từ %s) và đang chờ duyệt lại.",
                                            title, property.getId(), originalStatus.name());
                                    adminNotificationType = NotificationType.LISTING_EDITED_PENDING;
                                }
                                // 🔥 [THÊM MỚI] Thông báo cho trường hợp Đăng lại
                                else if (originalStatus == PropertyStatus.EXPIRED) {
                                    adminMessage = String.format("Tin '%s' (ID: %d) vừa được ĐĂNG LẠI và đang chờ duyệt.",
                                            title, property.getId());
                                    // Có thể dùng NEW_LISTING_PENDING hoặc tạo enum mới REPOST_PENDING
                                    adminNotificationType = NotificationType.NEW_LISTING_PENDING;
                                }
                                else {
                                    // Mặc định (từ Draft hoặc sửa tin đang Active)
                                    adminMessage = String.format("Tin đăng '%s' (ID: %d) đang chờ duyệt.",
                                            title, property.getId());
                                    adminNotificationType = NotificationType.NEW_LISTING_PENDING;
                                }

                                String adminLink = String.format("/admin/posts?reviewPostId=%d", property.getId());
                                for (UserEntity admin : admins) {
                                    notificationService.createNotification(
                                            admin, adminNotificationType, adminMessage, adminLink
                                    );
                                }
                            }

                            // 5.2 Gửi thông báo cho User (Luôn giống nhau)
                            String userMessage = String.format("Tin đăng '%s' của bạn đã được cập nhật và đang chờ duyệt lại.", title);
                            String userLink = "/dashboard/posts?tab=pending";
                            notificationService.createNotification(
                                    property.getUser(), NotificationType.LISTING_PENDING_USER, userMessage, userLink
                            );

                        } catch (Exception e) {
                            log.error("Notify error (listing updated OK): {}", e.getMessage(), e);
                        }

                    } else if (mode == SubmitMode.DRAFT) {
                        property.setStatus(PropertyStatus.DRAFT);
                    }

                    // 6. LƯU VÀO DB
                    var saved = propertyRepository.save(property);

                    try {
                        log.info("Đang gửi tín hiệu WS refresh đến /topic/admin/properties (do user update)");
                        messagingTemplate.convertAndSend("/topic/admin/properties", "user_update");
                    } catch (Exception e) {
                        log.error("Lỗi khi gửi tín hiệu WS refresh admin: {}", e.getMessage());
                    }

                    return new CreatePropertyResponse(saved.getId(), saved.getStatus());
                }private void applyRequestToEntity(PropertyEntity property,
                                                  CreatePropertyRequest req,
                                                  boolean createMode,
                                                  @org.springframework.lang.Nullable SubmitMode mode) {

                    // === Map FK (cho phép null) ===
                    if (req.getCategoryId() != null) {
                        property.setCategory(categoryRepository.findById(req.getCategoryId())
                                .orElseThrow(() -> new IllegalArgumentException("Invalid categoryId")));
                    }
                    if (req.getCityId() != null) {
                        property.setCity(req.getCityId() == null ? null : cityRepository.findById(req.getCityId()).orElse(null));
                    }
                    if (req.getDistrictId() != null) {
                        property.setDistrict(req.getDistrictId() == null ? null : districtRepository.findById(req.getDistrictId()).orElse(null));
                    }
                    if (req.getWardId() != null) {
                        property.setWard(req.getWardId() == null ? null : wardRepository.findById(req.getWardId()).orElse(null));
                    }

                    // === Fields cơ bản ===
                    if (req.getTitle() != null)         property.setTitle(req.getTitle());
                    if (req.getPrice() != null)         property.setPrice(req.getPrice());
                    if (req.getArea() != null)          property.setArea(req.getArea());
                    if (req.getLandArea() != null)      property.setLandArea(req.getLandArea());
                    if (req.getBedrooms() != null)      property.setBedrooms(req.getBedrooms());
                    if (req.getBathrooms() != null)     property.setBathrooms(req.getBathrooms());
                    if (req.getAddressStreet() != null) property.setAddressStreet(req.getAddressStreet());
                    if (req.getDisplayAddress() != null)property.setDisplayAddress(req.getDisplayAddress());
                    if (req.getPosition() != null)      property.setPosition(req.getPosition());
                    if (req.getLegalStatus() != null)   property.setLegalStatus(req.getLegalStatus());
                    if (req.getDirection() != null)     property.setDirection(req.getDirection());
                    if (req.getDescription() != null)   property.setDescription(req.getDescription());
                    if (req.getFloors() != null)        property.setFloors(req.getFloors());
                    if (req.getWidth() != null)         property.setWidth(req.getWidth());
                    if (req.getHeight() != null)        property.setHeight(req.getHeight());

                    if (req.getPropertyType() != null) {
                        property.setPropertyType(PropertyType.valueOf(req.getPropertyType().name()));
                    }
                    if (req.getPriceType() != null) {
                        property.setPriceType(PriceType.valueOf(req.getPriceType().name()));
                    }

                    // === Ảnh & tiện ích (replace) ===
                    if (req.getImageUrls() != null) {
                        property.replaceImages(req.getImageUrls());
                    }
                    if (req.getConstructionImages() != null) {
                        property.replaceConstructionImages(req.getConstructionImages());
                    }
                    if (req.getAmenityIds() != null) {
                        var amenities = req.getAmenityIds().isEmpty()
                                ? java.util.Collections.<AmenityEntity>emptyList()
                                : amenityRepository.findAllById(req.getAmenityIds());
                        property.setAmenities(amenities);
                    }
                    if (req.getIsOwner() != null) property.setIsOwner(req.getIsOwner());

                    if (Boolean.TRUE.equals(property.getIsOwner())) {
                        // Nếu chính chủ: auto-fill từ User nếu FE không gửi
                        var u = property.getUser();
                        if (req.getContactName() != null)  property.setContactName(req.getContactName());
                        else if (u != null)                property.setContactName((u.getFirstName() + " " + u.getLastName()).trim());

                        if (req.getContactEmail() != null) property.setContactEmail(req.getContactEmail());
                        else if (u != null)                property.setContactEmail(u.getEmail());

                        if (req.getContactPhone() != null) property.setContactPhone(req.getContactPhone());
                        else if (u != null)                property.setContactPhone(u.getPhone()); // tuỳ field của bạn
                    } else {
                        // Không chính chủ: lấy đúng theo req (không tự fill)
                        if (req.getContactName() != null)  property.setContactName(req.getContactName());
                        if (req.getContactEmail() != null) property.setContactEmail(req.getContactEmail());
                        if (req.getContactPhone() != null) property.setContactPhone(req.getContactPhone());
                        if (req.getContactRelationship() != null) property.setContactRelationship(req.getContactRelationship());

                    }
                    // === Status khi tạo ===
                    if (createMode) {
                        SubmitMode effective = (mode == null) ? SubmitMode.PUBLISHED : mode;
                        property.setStatus(effective == SubmitMode.DRAFT ? PropertyStatus.DRAFT : PropertyStatus.PENDING_REVIEW);
                    }

                    if (req.getAutoRenew() != null) {
                        property.setAutoRenew(req.getAutoRenew());
                    } else if (createMode) {
                        // Mặc định false nếu tạo mới mà không gửi lên
                        property.setAutoRenew(false);
                    }


                }

                /* =====================    ====================================
                 * MY PROPERTIES (WITH MAP FILTERS)
                 * ========================================================= */
                @Override
                public Page<PropertyDTO> getPropertiesByUser(Long userId,
                                                             String status,
                                                             Pageable pageable,
                                                             Map<String,String> filters) {

                    Specification<PropertyEntity> spec = (root, query, cb) ->
                            cb.equal(root.get("user").get("userId"), userId);

                    // 1) status
                    spec = spec.and(buildStatusSpec(status));

                    // 2) filters
                    if (filters != null && !filters.isEmpty()) {

                        // q: keyword over title/description/displayAddress/addressStreet + ward/district/city
                        String q = trim(filters.get("q"));
                        if (q != null) {
                            final String[] tokens = q.toLowerCase().split("\\s+");
                            spec = spec.and((root, qy, cb2) -> {
                                Join<PropertyEntity, WardEntity> ward = safeLeftJoin(root, "ward");
                                Join<PropertyEntity, DistrictEntity> dist = safeLeftJoin(root, "district");
                                Join<PropertyEntity, CityEntity> city = safeLeftJoin(root, "city");

                                List<Predicate> andPreds = new ArrayList<>();
                                for (String token : tokens) {
                                    String like = "%" + token + "%";
                                    List<Predicate> ors = new ArrayList<>();
                                    ors.add(cb2.like(cb2.lower(root.get("title")), like));
                                    ors.add(cb2.like(cb2.lower(root.get("description")), like));
                                    ors.add(cb2.like(cb2.lower(root.get("displayAddress")), like));
                                    ors.add(cb2.like(cb2.lower(root.get("addressStreet")), like));
                                    if (ward != null) ors.add(cb2.like(cb2.lower(ward.get("name")), like));
                                    if (dist != null) ors.add(cb2.like(cb2.lower(dist.get("name")), like));
                                    if (city != null) ors.add(cb2.like(cb2.lower(city.get("name")), like));
                                    andPreds.add(cb2.or(ors.toArray(new Predicate[0])));
                                }
                                return cb2.and(andPreds.toArray(new Predicate[0]));
                            });
                        }

                        // code: nếu FE nhập số → match id
                        String code = trim(filters.get("code"));
                        if (code != null) {
                            Long maybeId = tryParseLong(code);
                            if (maybeId != null) {
                                spec = spec.and((r, qy, cb2) -> cb2.equal(r.get("id"), maybeId));
                            }
                        }

                        // area (địa lý): district/city name contains
                        String areaGeo = trim(filters.get("area"));
                        if (areaGeo != null) {
                            spec = spec.and((root, qy, cb2) -> {
                                Join<PropertyEntity, DistrictEntity> dist = safeLeftJoin(root, "district");
                                Join<PropertyEntity, CityEntity> city = safeLeftJoin(root, "city");
                                String like = "%" + areaGeo.toLowerCase() + "%";
                                List<Predicate> ors = new ArrayList<>();
                                if (dist != null) ors.add(cb2.like(cb2.lower(dist.get("name")), like));
                                if (city != null) ors.add(cb2.like(cb2.lower(city.get("name")), like));
                                return ors.isEmpty() ? cb2.conjunction() : cb2.or(ors.toArray(new Predicate[0]));
                            });
                        }

                        String areaSlug = trim(filters.get("areaSlug")); // Tên param mới

                        if (areaSlug != null) {
                            final String slugToMatch = areaSlug.toLowerCase();

                            spec = spec.and((root, qy, cb2) -> {
                                Join<PropertyEntity, DistrictEntity> dist = safeLeftJoin(root, "district");
                                Join<PropertyEntity, CityEntity> city = safeLeftJoin(root, "city");

                                List<Predicate> ors = new ArrayList<>();

                                // So sánh chính xác với City Slug
                                if (city != null) {
                                    ors.add(cb2.equal(cb2.lower(city.get("slug")), slugToMatch));
                                }
                                // So sánh chính xác với District Slug
                                if (dist != null) {
                                    ors.add(cb2.equal(cb2.lower(dist.get("slug")), slugToMatch));
                                }

                                return ors.isEmpty() ? cb2.conjunction() : cb2.or(ors.toArray(new Predicate[0]));
                            });
                        }

                        // diện tích: area (float)
                        Integer areaMin = parseInt(filters.get("areaMin")).orElse(null);
                        Integer areaMax = parseInt(filters.get("areaMax")).orElse(null);
                        if (areaMin != null) spec = spec.and((r, qy, cb2) -> cb2.ge(r.get("area"), areaMin));
                        if (areaMax != null) spec = spec.and((r, qy, cb2) -> cb2.le(r.get("area"), areaMax));

                        // giá: price (Double)
                        Long priceMin = parseLong(filters.get("priceMin")).orElse(null);
                        Long priceMax = parseLong(filters.get("priceMax")).orElse(null);
                        if (priceMin != null) spec = spec.and((r, qy, cb2) -> cb2.ge(r.get("price"), priceMin.doubleValue()));
                        if (priceMax != null) spec = spec.and((r, qy, cb2) -> cb2.le(r.get("price"), priceMax.doubleValue()));

                        // expireDate (YYYY-MM-DD) -> expiresAt (Timestamp in day range)
                        String expireDate = trim(filters.get("expireDate"));
                        if (expireDate != null) {
                            LocalDate d = LocalDate.parse(expireDate);
                            Timestamp start = Timestamp.valueOf(d.atStartOfDay());
                            Timestamp end = Timestamp.valueOf(d.plusDays(1).atStartOfDay().minusNanos(1));
                            spec = spec.and((r, qy, cb2) -> cb2.between(r.get("expiresAt"), start, end));
                        }
                    }

                    return propertyRepository.findAll(spec, pageable).map(propertyConverter::toDto);
                }

                @Override
                public Map<String, Long> getPropertyCountsByStatus(Long userId) {
                    Map<String, Long> counts = new HashMap<>();
                    counts.put("active", 0L);
                    counts.put("pending", 0L);
                    counts.put("draft", 0L);
                    counts.put("rejected", 0L);
                    counts.put("hidden", 0L);
                    counts.put("expired", 0L);
                    counts.put("expiringSoon", 0L);
                    counts.put("warned", 0L);

                    List<IPropertyCount> results = propertyRepository.countByStatus(userId);
                    for (IPropertyCount item : results) {
                        String frontendKey = mapBackendStatusToFrontendKey(item.getStatus());
                        if (frontendKey != null) counts.put(frontendKey, item.getCount());
                    }
                    return counts;
                }

                /* =========================================================
                 * FAVORITERS
                 * ========================================================= */
                @Override
                public List<UserFavoriteDTO> getUsersWhoFavorited(Long propertyId, Long currentUserId) {
                    PropertyEntity property = propertyRepository.findById(propertyId)
                            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tin đăng với ID: " + propertyId));

                    if (!property.getUser().getUserId().equals(currentUserId)) {
                        throw new AccessDeniedException("Bạn không có quyền xem danh sách yêu thích của tin đăng này");
                    }

                    List<SavedPropertyEntity> saves = savedPropertyRepository.findByProperty_Id(propertyId);
                    return saves.stream()
                            .map(savedProperty -> userConverter.toFavoriteDto(savedProperty.getUser()))
                            .collect(Collectors.toList());
                }


                @Transactional(readOnly = true)
                @Override
                public List<PropertyCardDTO> getRecommendations(Long userId, int limit, Long anchorCityId) {

                    return getRecommendations(
                            userId, limit, anchorCityId, null,
                            null, null,
                            null, null
                    ).getItems();
                }

                @Transactional(readOnly = true)
                @Override
                public RecoResult getRecommendations(
                        Long userId, int limit, Long anchorCityId, List<Long> nearCityIds,
                        Double minPriceIn, Double maxPriceIn,
                        Float  minAreaIn,  Float  maxAreaIn
                ) {
                    log.info("[Reco] userId={}, limit={}, anchor={}, near={}, priceIn[{},{}], areaIn[{},{}]",
                            userId, limit, anchorCityId, nearCityIds, minPriceIn, maxPriceIn, minAreaIn, maxAreaIn);

                    // ===== 1) Hành vi người dùng =====
                    List<Long> savedIds = savedPropertyRepository.findPropertyIdsByUser(userId);
                    log.info("[Reco][Behavior] savedIds size={} sample={}",
                            savedIds.size(),
                            savedIds.stream().limit(10).toList()
                    );

                    List<PropertyType> favTypes = savedPropertyRepository.topPropertyTypes(userId).stream()
                            .map(r -> (PropertyType) r[0])
                            .limit(3)
                            .toList();
                    if (favTypes == null || favTypes.isEmpty()) {
                        favTypes = List.of(PropertyType.sell, PropertyType.rent);
                        log.info("[Reco][Behavior] no favTypes from history -> fallback [sell, rent]");
                    } else {
                        log.info("[Reco][Behavior] raw favTypes from history={}", favTypes);
                        Set<PropertyType> all = new HashSet<>(favTypes);
                        all.add(PropertyType.sell);
                        all.add(PropertyType.rent);
                        favTypes = new ArrayList<>(all);
                        log.info("[Reco][Behavior] merged favTypes (with defaults)={}", favTypes);
                    }
                    final List<PropertyType> finalFavTypes = List.copyOf(favTypes);

                    List<Long> favCityIds = savedPropertyRepository.topCityIds(userId).stream()
                            .map(r -> (Long) r[0])
                            .filter(Objects::nonNull)
                            .distinct()
                            .limit(3)
                            .toList();
                    final Set<Long> favCitySet = new HashSet<>(favCityIds);
                    log.info("[Reco][Behavior] favCityIds={} (set={})", favCityIds, favCitySet);

                    // ===== 2) Range: ưu tiên FE, rỗng thì lấy thống kê từ saved =====
                    Double minPrice = minPriceIn, maxPrice = maxPriceIn;
                    Float  minArea  = minAreaIn,  maxArea  = maxAreaIn;

                    if (minPrice == null && maxPrice == null && minArea == null && maxArea == null) {
                        List<Object[]> rows = savedPropertyRepository.priceAreaMinMax(userId);
                        log.info("[Reco][Behavior] FE range empty -> lookup priceAreaMinMax rows.size={}",
                                rows == null ? 0 : rows.size());

            //            if (rows != null && !rows.isEmpty()) {
            //                Object[] r = rows.get(0);
            //                if (r != null && r.length == 4) {
            //                    minPrice = toD(r[0]);
            //                    maxPrice = toD(r[1]);
            //                    Double minAreaD = toD(r[2]);
            //                    Double maxAreaD = toD(r[3]);
            //                    minArea = minAreaD == null ? null : minAreaD.floatValue();
            //                    maxArea = maxAreaD == null ? null : maxAreaD.floatValue();
            //                }
            //            }
                        if (rows != null && !rows.isEmpty()) {
                            Object[] r = rows.get(0);
                            if (r != null && r.length == 4) {
                                Double maxPriceD = toD(r[1]);   // max price từ history
                                Double maxAreaD  = toD(r[3]);   // max area từ history
                                if (maxPriceD != null && maxPriceD > 0) {
                                    minPrice = 0d;
                                    maxPrice = maxPriceD;
                                }

                                if (maxAreaD != null && maxAreaD > 0) {
                                    minArea = 0f;
                                    maxArea = maxAreaD.floatValue();
                                }
                            }
                        }
                        log.info("[Reco][Behavior] range from history (0→max) -> price[{},{}], area[{},{}]",
                                minPrice, maxPrice, minArea, maxArea);

                        log.info("[Reco][Behavior] range from history -> price[{},{}], area[{},{}]",
                                minPrice, maxPrice, minArea, maxArea);
                    } else {
                        log.info("[Reco][Behavior] range from FE -> price[{},{}], area[{},{}]",
                                minPrice, maxPrice, minArea, maxArea);
                    }

                    if (minPrice != null && maxPrice != null && minPrice.equals(maxPrice)) minPrice = 0d;
                    if (minArea  != null && maxArea  != null && minArea.equals(maxArea))   minArea  = 0f;

                    boolean priceOk = (minPrice != null && maxPrice != null && minPrice >= 0 && maxPrice > 0);
                    boolean areaOk  = (minArea  != null && maxArea  != null && minArea  >= 0 && maxArea  > 0);

                    // ========================= 2.1) No-signal guard =========================
                    boolean hasAnyCitySignal =
                            (anchorCityId != null) ||
                                    (nearCityIds != null && !nearCityIds.isEmpty()) ||
                                    (!favCityIds.isEmpty());

                    boolean hasAnyRangeSignal = priceOk || areaOk;

                    log.info("[Reco][Behavior] hasAnyCitySignal={}, hasAnyRangeSignal={}, priceOk={}, areaOk={}",
                            hasAnyCitySignal, hasAnyRangeSignal, priceOk, areaOk);

                    if (!hasAnyCitySignal && !hasAnyRangeSignal) {
                        log.info("[Reco] no-signal guard -> return empty to avoid dumping all posts");
                        return RecoResult.builder()
                                .items(Collections.emptyList())
                                .source("empty") // hoặc "no-signal"
                                .anchorCityId(null)
                                .nearCityIds(List.of())
                                .build();
                    }

                    // ===== 3) Base spec =====
                    Specification<PropertyEntity> baseSpec = RecommendationSpec.andSafe(
                            RecommendationSpec.statusPublished(),
                            RecommendationSpec.inPropertyTypes(finalFavTypes),
                            RecommendationSpec.notInIds(savedIds)
                    );

                    Specification<PropertyEntity> rangeSpec = null;
                    if (priceOk && areaOk) {
                        rangeSpec = RecommendationSpec.andSafe(
                                RecommendationSpec.priceBetween(minPrice, maxPrice),
                                RecommendationSpec.areaBetween(minArea, maxArea)
                        );
                    } else if (priceOk) {
                        rangeSpec = RecommendationSpec.priceBetween(minPrice, maxPrice);
                    } else if (areaOk) {
                        rangeSpec = RecommendationSpec.areaBetween(minArea, maxArea);
                    }

                    // ===== 4) Preferred cities (exact) từ FE: anchor + near =====
                    List<Long> preferredCityIds = new ArrayList<>();
                    if (anchorCityId != null) preferredCityIds.add(anchorCityId);
                    if (nearCityIds != null && !nearCityIds.isEmpty()) {
                        for (Long id : nearCityIds) {
                            if (id != null && !Objects.equals(id, anchorCityId)) {
                                preferredCityIds.add(id);
                            }
                        }
                    }
                    log.info("[Reco][Behavior] preferredCityIds (from FE + near)={}", preferredCityIds);

                    Specification<PropertyEntity> spec = RecommendationSpec.andSafe(baseSpec, rangeSpec);
                    if (!preferredCityIds.isEmpty()) {
                        spec = RecommendationSpec.andSafe(spec, RecommendationSpec.inCityIds(preferredCityIds));
                    } else if (anchorCityId != null) {
                        spec = RecommendationSpec.andSafe(spec, RecommendationSpec.cityIdEquals(anchorCityId));
                    } else if (!favCityIds.isEmpty()) {
                        spec = RecommendationSpec.andSafe(spec, RecommendationSpec.inCityIds(favCityIds));
                    }

                    int pageSize = Math.max(limit * 3, 24);
                    List<PropertyEntity> candidates = propertyRepository.findAll(
                            spec,
                            PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "postedAt"))
                    ).getContent();

                    // City nào đã có bài trong candidates?
                    Set<Long> hitCityIds = candidates.stream()
                            .map(e -> e.getCity() != null ? e.getCity().getId() : null)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());
                    log.info("[Reco] hitCityIds from initial candidates: {} (candidates={})",
                            hitCityIds, candidates.size());

                    // ========== LOG DANH SÁCH CANDIDATES TRƯỚC KHI RERANK ==========
                    log.info("\n=========================== CANDIDATES BEFORE AI ===========================");
                    log.info("[Reco][Candidates] total candidates = {}", candidates.size());
                    log.info("[Reco][Candidates] show up to first 20 items:");
                    int idx = 1;
                    for (PropertyEntity e : candidates.stream().limit(20).toList()) {
                        Long cid = e.getCity() != null ? e.getCity().getId() : null;
                        log.info(String.format(
                                " #%02d | id=%d | city=%s | type=%s | price=%.0f | area=%.0f | postedAt=%s",
                                idx++,
                                e.getId(),
                                cid,
                                e.getPropertyType(),
                                e.getPrice(),
                                e.getArea(),
                                e.getPostedAt()
                        ));
                    }
                    log.info("============================================================================\n");

                    String source = preferredCityIds.isEmpty() ? "personalized" : "personalized";
                    List<Long> usedNearIds = new ArrayList<>();
                    Long usedAnchor = (anchorCityId != null)
                            ? anchorCityId
                            : (!favCityIds.isEmpty() ? favCityIds.get(0) : null);

                    // ===== 5) Fallback đa-anchor (chỉ cho city chưa có bài) =====
                    List<Long> anchors = new ArrayList<>();
                    if (anchorCityId != null) anchors.add(anchorCityId);
                    if (nearCityIds != null) {
                        for (Long id : nearCityIds) {
                            if (id != null) anchors.add(id);
                        }
                    }
                    anchors.addAll(favCityIds);
                    anchors = new ArrayList<>(new LinkedHashSet<>(anchors)); // de-dup giữ thứ tự

                    List<Long> fallbackAnchors = anchors.stream()
                            .filter(a -> a != null && !hitCityIds.contains(a))
                            .toList();

                    if (candidates.size() < limit && !fallbackAnchors.isEmpty()) {
                        final int k = 6; // số city lân cận cho mỗi anchor
                        LinkedHashSet<Long> unionNear = new LinkedHashSet<>();

                        for (Long anc : fallbackAnchors) {
                            List<CityEntity> near = cityRepository.findNearestCities(anc, k);
                            List<Long> nearIds = near.stream()
                                    .map(CityEntity::getId)
                                    .toList();
                            log.info("[Reco] nearby cities for anchor {} (fallback only) -> {}", anc, nearIds);

                            for (CityEntity c : near) {
                                Long cid = c.getId();
                                if (cid != null && !Objects.equals(cid, anc)) {
                                    unionNear.add(cid);
                                }
                            }
                        }

                        // Không fallback lại vào những city đã có bài hoặc city user đã chọn
                        unionNear.removeAll(hitCityIds);
                        unionNear.removeAll(new LinkedHashSet<>(preferredCityIds));

                        if (!unionNear.isEmpty()) {
                            Specification<PropertyEntity> nearbySpec = RecommendationSpec.andSafe(baseSpec, rangeSpec);
                            nearbySpec = RecommendationSpec.andSafe(
                                    nearbySpec,
                                    RecommendationSpec.inCityIds(new ArrayList<>(unionNear))
                            );

                            List<PropertyEntity> more = propertyRepository.findAll(
                                    nearbySpec,
                                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "postedAt"))
                            ).getContent();

                            if (!more.isEmpty()) {
                                LinkedHashMap<Long, PropertyEntity> merged = new LinkedHashMap<>();
                                for (PropertyEntity e : candidates) merged.put(e.getId(), e);
                                for (PropertyEntity e : more) merged.putIfAbsent(e.getId(), e);

                                candidates = new ArrayList<>(merged.values());
                                source = "nearby";
                                usedNearIds = new ArrayList<>(unionNear);

                                if (usedAnchor == null && !anchors.isEmpty()) {
                                    usedAnchor = anchors.get(0);
                                }

                                log.info(
                                        "[Reco] multi-anchor nearby fallback anchors={}, fallbackAnchors={}, unionNear={}, gotCandidates={}",
                                        anchors, fallbackAnchors, usedNearIds, candidates.size()
                                );
                            }
                        }
                    }

                    if (candidates.isEmpty()) {
                        log.info("[Reco] empty even after multi-anchor nearby fallback");
                        return RecoResult.builder()
                                .items(Collections.emptyList())
                                .source("empty")
                                .anchorCityId(usedAnchor)
                                .nearCityIds(usedNearIds)
                                .build();
                    }

                    // ===== 6) Scoring (+ AI rerank) =====
                    final Double priceCenter = priceOk ? (minPrice + maxPrice) / 2.0 : null;
                    final Float  areaCenter  = areaOk  ? (minArea + maxArea) / 2.0f     : null;

                    List<ScoredProperty> scored = candidates.stream().map(e -> {
                        double baseScore = scoreRangeAware(
                                e, finalFavTypes, favCitySet,
                                priceCenter == null ? 0d : priceCenter,
                                areaCenter  == null ? 0d : areaCenter.doubleValue()
                        );
                        return ScoredProperty.builder()
                                .id(e.getId())
                                .title(e.getTitle())
                                .description(e.getDescription())
                                .price(e.getPrice())
                                .area(e.getArea())
                                .cityId(e.getCity() != null ? e.getCity().getId() : null)
                                .type(e.getPropertyType())
                                .baseScore(baseScore)
                                .build();
                    }).toList();

                    // ========== LOG BẢNG BASE SCORE ==========
                    log.info("=========================== BASE SCORE TABLE ===========================");
                    idx = 1;
                    for (ScoredProperty sp : scored.stream().limit(20).toList()) {
                        log.info(String.format(
                                " #%02d | id=%d | baseScore=%.4f | city=%s | price=%.0f | area=%.0f | type=%s",
                                idx++,
                                sp.getId(),
                                sp.getBaseScore(),
                                sp.getCityId(),
                                sp.getPrice(),
                                sp.getArea(),
                                sp.getType()
                        ));
                    }
                    log.info("=========================================================================\n");

                    if (anchorCityId != null) preferredCityIds.add(anchorCityId);
                    if (nearCityIds != null) preferredCityIds.addAll(nearCityIds);
                    preferredCityIds.addAll(favCityIds);
                    preferredCityIds = new ArrayList<>(new LinkedHashSet<>(preferredCityIds)); // de-dup

                    UserPreference pref = UserPreference.builder()
                            .userId(userId)

                            // Cities
                            .anchorCityId(usedAnchor)
                            .nearCityIds(usedNearIds)
                            .preferredCityIds(preferredCityIds)
                            .favCityIds(favCityIds)

                            // Types
                            .favTypes(finalFavTypes)

                            // Range
                            .priceMin(minPrice)
                            .priceMax(maxPrice)
                            .areaMin(minArea)
                            .areaMax(maxArea)

                            // Lịch sử, keyword
                            .savedIds(savedIds)
                            .keywords(List.of())
                            .limit(limit)
                            .build();

                    log.info("[Reco][Behavior] final UserPreference: {}", pref);

                    // ========== LOG TRƯỚC KHI GỬI AI ==========
                    log.info("=========================== SEND TO AI ==========================");
                    log.info("[AI] sending {} items for rerank (limit={})", scored.size(), limit);
                    for (ScoredProperty sp : scored.stream().limit(20).toList()) {
                        log.info(" [AI] cand id={} | baseScore={}", sp.getId(),
                                String.format("%.4f", sp.getBaseScore()));
                    }
                    log.info("=================================================================\n");

                    List<ScoredProperty> aiRanked = aiService.rerank(pref, scored, limit);

                    Map<Long, PropertyEntity> byId = candidates.stream()
                            .collect(Collectors.toMap(PropertyEntity::getId, it -> it));

                    List<PropertyCardDTO> result = new ArrayList<>();
                    for (ScoredProperty sp : aiRanked) {
                        PropertyEntity e = byId.get(sp.getId());
                        if (e != null) {
                            result.add(propertyMapper.toPropertyCardDTO(e));
                        }
                    }

                    log.info("[Reco] done -> resultSize={}, source={}, usedAnchor={}, usedNear={}",
                            result.size(), source, usedAnchor, usedNearIds);

                    return RecoResult.builder()
                            .items(result)
                            .source(source)
                            .anchorCityId(usedAnchor)
                            .nearCityIds(usedNearIds)
                            .build();
                }






                /* ===== helper: chuyển Object → Double an toàn ===== */




                private double scoreRangeAware(PropertyEntity p,
                                               List<PropertyType> favTypes,
                                               Set<Long> favCityIds,
                                               double priceCenter,
                                               double areaCenter) {
                    double s = 0.0;

                    // (1) GIÁ — ưu tiên gần median
                    if (priceCenter > 0 && p.getPrice() != null && p.getPrice() > 0) {
                        double denom = Math.max(1d, priceCenter * 0.25);
                        double close = Math.max(0, 1 - Math.abs(p.getPrice() - priceCenter) / denom);
                        s += close * 2.4;
                    }

                    // (2) DIỆN TÍCH — ưu tiên gần median
                    if (areaCenter > 0 && p.getArea() > 0) {
                        double denom = Math.max(1d, areaCenter * 0.25);
                        double close = Math.max(0, 1 - Math.abs(p.getArea() - areaCenter) / denom);
                        s += close * 1.2;
                    }

                    // (3) Loại BĐS ưa thích
                    if (p.getPropertyType() != null && favTypes != null && favTypes.contains(p.getPropertyType())) {
                        s += 0.6;
                    }

                    // (4) Listing Type
                    if (p.getListingType() != null) {
                        switch (p.getListingType()) {
                            case VIP     -> s += 0.8;
                            case PREMIUM -> s += 1.0;
                            default -> {}
                        }
                    }

                    // (5) Độ mới
                    if (p.getPostedAt() != null) {
                        long days = Math.max(0, Duration.between(p.getPostedAt().toInstant(), Instant.now()).toDays());
                        double recency = Math.max(0, 1 - (days / 30.0));
                        s += recency * 0.2;
                    }

                    // (6) City ưa thích → BOOST
                    try {
                        Long cId = (p.getCity() != null) ? p.getCity().getId() : null;
                        if (cId != null && favCityIds != null && favCityIds.contains(cId)) {
                            s += 1.1;  // hệ số boost city
                        }
                    } catch (Exception ignore) {}

                    return s;
                }

                private static double median(Double a, Double b) {
                    if (a == null && b == null) return 0d;
                    if (a == null) return b;
                    if (b == null) return a;
                    return (a + b) / 2.0;
                }


                @Override
                public PropertyKpiResponse propertiesKpi(String range, String status, String pendingStatus) {
                    String st = (status == null || status.isBlank()) ? "PUBLISHED" : status.toUpperCase();
                    String pend = (pendingStatus == null || pendingStatus.isBlank()) ? "PENDING_REVIEW" : pendingStatus.toUpperCase();

                    LocalDate today = LocalDate.now(ZONE_VN);
                    Range cur = resolveRange(range, today);
                    Range prev = previousRange(cur);

                    Instant cs = cur.start.atZone(ZONE_VN).toInstant();
                    Instant ce = cur.end.atZone(ZONE_VN).toInstant();
                    Instant ps = prev.start.atZone(ZONE_VN).toInstant();
                    Instant pe = prev.end.atZone(ZONE_VN).toInstant();

                    long totalCur  = propertyRepository.countPostedBetween(cs, ce, st);
                    long totalPrev = propertyRepository.countPostedBetween(ps, pe, st);
                    double pct = (totalPrev == 0) ? (totalCur > 0 ? 1.0 : 0.0) : (double) (totalCur - totalPrev) / totalPrev;

                    List<Object[]> rows = propertyRepository.dailyPostedSeries(cs, ce, TZ_OFFSET, st);
                    Map<LocalDate, Long> map = new LinkedHashMap<>();
                    for (LocalDate d = cur.start.toLocalDate(); !d.isAfter(cur.end.toLocalDate().minusDays(1)); d = d.plusDays(1)) {
                        map.put(d, 0L);
                    }
                    for (Object[] r : rows) {
                        LocalDate day = LocalDate.parse(String.valueOf(r[0]));
                        long c = ((Number) r[1]).longValue();
                        map.put(day, c);
                    }
                    List<PropertyKpiResponse.SeriesPoint> series = new ArrayList<>();
                    map.forEach((d, c) -> series.add(
                            PropertyKpiResponse.SeriesPoint.builder().date(d.toString()).count(c).build()
                    ));

                    long pending = propertyRepository.countPending(pend);

                    return PropertyKpiResponse.builder()
                            .summary(PropertyKpiResponse.Summary.builder()
                                    .total(totalCur)
                                    .compareToPrev(pct)
                                    .pending(pending)
                                    .previousTotal(totalPrev)
                                    .build())
                            .series(series)
                            .range(PropertyKpiResponse.RangeDto.builder()
                                    .start(cur.start.toString()).end(cur.end.toString()).build())
                            .build();
                }

                @Override
                public PageResponse<PendingPropertyDTO> findPending(String q, int page, int size) {
                    final String query = (q == null || q.isBlank()) ? null : q.trim();
                    final var pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));

                    final var rows = propertyRepository.findPending(PropertyStatus.PENDING_REVIEW, query, pageable);

                    final var dtoPage = rows.map(r -> PendingPropertyDTO.builder()
                            .id(r.getId())
                            .title(r.getTitle())
                            .author(r.getAuthor())
                            .postedDate(
                                    r.getPostedAt() == null ? null :
                                            r.getPostedAt().toInstant().atZone(ZONE_VN).toLocalDate().toString()
                            )
                            .build()
                    );

                    return PageResponse.from(dtoPage);
                }

                @Override
                @Transactional(readOnly = true)
                public PropertyDTO getDetailForEdit(Long propertyId, Long requesterUserId) {
                    PropertyEntity property = propertyRepository.findDetailForEdit(propertyId)
                            .orElseThrow(() -> new IllegalArgumentException("Property not found"));
                    if (property.getUser() == null || !property.getUser().getUserId().equals(requesterUserId)) {
                        throw new AccessDeniedException("Bạn không có quyền truy cập tin đăng này");
                    }

                    return propertyConverter.toDto(property);
                }

                @Override
                @Transactional
                public PropertyActionResponse performAction(Long userId, Long propertyId, PropertyAction action, String note) {
                    // 1) Tải tin + kiểm tra quyền sở hữu
                    var property = propertyRepository.findById(propertyId)
                            .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));

                    if (property.getUser() == null || !Objects.equals(property.getUser().getUserId(), userId)) {
                        throw new AccessDeniedException("Bạn không có quyền thao tác tin này");
                    }

                    final PropertyStatus current = property.getStatus();
                    final PropertyStatus target;

                    // 2) Xác thực & chuyển trạng thái
                    switch (action) {
                        case HIDE -> {
                            if (!(current == PropertyStatus.PUBLISHED || current == PropertyStatus.EXPIRINGSOON)) {
                                throw new IllegalStateException("Không thể ẨN tin từ trạng thái: " + current);
                            }
                            target = PropertyStatus.HIDDEN;
                        }
                        case UNHIDE -> {
                            if (current != PropertyStatus.HIDDEN) {
                                throw new IllegalStateException("Chỉ có thể BỎ ẨN tin đang ở trạng thái HIDDEN");
                            }
                            // Có thể khôi phục về trạng thái trước khi ẩn nếu bạn lưu previousStatus; hiện khôi phục về PUBLISHED cho đơn giản
                            target = PropertyStatus.PUBLISHED;
                        }
                        case MARK_SOLD -> {
                            if (!(current == PropertyStatus.PUBLISHED || current == PropertyStatus.EXPIRINGSOON || current == PropertyStatus.HIDDEN)) {
                                throw new IllegalStateException("Không thể đánh dấu ĐÃ BÁN từ trạng thái: " + current);
                            }
                            target = PropertyStatus.ARCHIVED; // dùng ARCHIVED làm 'đã bán/đóng tin'
                            // TODO (tuỳ chọn): property.setSoldAt(Instant.now()); property.setSoldNote(note);
                        }
                        case UNMARK_SOLD -> {
                            if (current != PropertyStatus.ARCHIVED) {
                                throw new IllegalStateException("Chỉ có thể GỠ ĐÃ BÁN khi tin đang ARCHIVED");
                            }
                            target = PropertyStatus.PUBLISHED;
                        }
                        default -> throw new IllegalArgumentException("Unsupported action: " + action);
                    }

                    property.setStatus(target);
                    propertyRepository.save(property);

                    // 3) Gửi notification cho chủ tin
                    try {
                        String title = (property.getTitle() != null) ? property.getTitle() : ("Tin #" + property.getId());
                        String link = "/dashboard/posts";
                        String msg;
                        NotificationType nType;

                        switch (action) {
                            case HIDE -> {
                                msg = String.format("Bạn đã ẩn tin '%s'.", title);
                                nType = NotificationType.LISTING_HIDDEN;        // nếu chưa thêm, tạm dùng INFO
                            }
                            case UNHIDE -> {
                                msg = String.format("Bạn đã bỏ ẩn tin '%s'.", title);
                                nType = NotificationType.LISTING_UNHIDDEN;      // nếu chưa thêm, tạm dùng INFO
                            }
                            case MARK_SOLD -> {
                                msg = String.format("Bạn đã đánh dấu '%s' đã giao dịch thành công.", title);
                                nType = NotificationType.LISTING_MARKED_SOLD;   // nếu chưa thêm, tạm dùng INFO
                            }
                            case UNMARK_SOLD -> {
                                msg = String.format("Bạn đã gỡ trạng thái giao dịch thaành công của '%s'.", title);
                                nType = NotificationType.LISTING_UNMARKED_SOLD; // nếu chưa thêm, tạm dùng INFO
                            }
                            default -> {
                                msg = "Cập nhật trạng thái tin của bạn.";
                                nType = NotificationType.SYSTEM_ANNOUNCEMENT;
                            }
                        }

                        notificationService.createNotification(property.getUser(), nType, msg, link);
                    } catch (Exception e) {
                        log.warn("Notify user after action failed: {}", e.getMessage());
                    }

                    // 4) Đẩy WS để FE refresh list/KPI
                    try {
                        messagingTemplate.convertAndSend("/topic/admin/properties", "user_update_action");
                    } catch (Exception e) {
                        log.error("WS push error: {}", e.getMessage());
                    }

                    log.info("PropertyAction userId={} propertyId={} action={} {}->{}",
                            userId, propertyId, action, current, target);

                    return PropertyActionResponse.builder()
                            .id(property.getId())
                            .newStatus(target)
                            .message("OK")
                            .build();
                }

                @Override
                @Transactional
                public void toggleAutoRenew(Long userId, Long propertyId, boolean enable) {
                    PropertyEntity property = propertyRepository.findById(propertyId)
                            .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

                    if (!property.getUser().getUserId().equals(userId)) {
                        throw new AccessDeniedException("Unauthorized");
                    }

                    // --- LOGIC VALIDATION MỚI ---
                    if (enable) {
                        // Chỉ cho phép bật khi tin đang hiển thị, sắp hết hạn, hoặc đang ẩn (để khi bỏ ẩn nó tự chạy)
                        // Tuyệt đối chặn: REJECTED, ARCHIVED, DRAFT
                        // Với EXPIRED: Bạn có thể chặn luôn, bắt user phải dùng nút "Đăng lại".
                        List<PropertyStatus> allowedStatuses = List.of(
                                PropertyStatus.PUBLISHED,
                                PropertyStatus.EXPIRINGSOON,
                                PropertyStatus.HIDDEN, // Cho phép bật lúc ẩn, nhưng Scheduler sẽ không quét tin ẩn (như query trên)
                                PropertyStatus.WARNED
                        );

                        if (!allowedStatuses.contains(property.getStatus())) {
                            throw new IllegalStateException("Trạng thái tin hiện tại (" + property.getStatus() + ") không hỗ trợ bật tự động gia hạn.");
                        }
                    }

                    property.setAutoRenew(enable);
                    propertyRepository.save(property);
                }

                /* =========================================================
                 * PRIVATE HELPERS
                 * ========================================================= */
                private static Specification<PropertyEntity> and(Specification<PropertyEntity> base, Specification<PropertyEntity> next) {
                    return next == null ? base : base.and(next);
                }
                private static Double toD(Object v) {
                    if (v == null) return null;
                    if (v instanceof Number n) return n.doubleValue();
                    try { return Double.parseDouble(String.valueOf(v)); } catch (Exception e) { return null; }
                }
                private static double n0(Double d) { return d == null ? 0d : d; }

                private double score(PropertyEntity p,
                                     List<PropertyType> favTypes,
                                     double avgPrice,
                                     double avgArea) {
                    double s = 0.0;

                    // (1) GIÁ — ƯU TIÊN CAO NHẤT
                    if (avgPrice > 0 && p.getPrice() != null && p.getPrice() > 0) {
                        double denom = avgPrice * 0.3; // siết còn 30% để ưu tiên sát giá hơn
                        double close = Math.max(0, 1 - Math.abs(p.getPrice() - avgPrice) / denom);
                        s += close * 3.0;              // tăng weight giá (trước đây là *2.0)
                    }

                    // (2) DIỆN TÍCH — ƯU TIÊN THỨ HAI
                    // (2) DIỆN TÍCH — ƯU TIÊN THỨ HAI
                    if (avgArea > 0 && p.getArea() > 0) {
                        double denom = avgArea * 0.3;  // tương tự 30% cho area
                        double close = Math.max(0, 1 - Math.abs(p.getArea() - avgArea) / denom);
                        s += close * 1.2;              // giảm nhẹ so với giá
                    }

                    // (3) LOẠI BĐS ƯA THÍCH — CỘNG NHẸ
                    if (p.getPropertyType() != null && favTypes != null && favTypes.contains(p.getPropertyType())) {
                        s += 0.6;
                    }

                    // (4) ƯU TIÊN LISTING TYPE — giữ nguyên logic cũ
                    if (p.getListingType() != null) {
                        switch (p.getListingType()) {
                            case VIP     -> s += 0.8;
                            case PREMIUM -> s += 1.0;
                            default -> {}
                        }
                    }

                    // (5) ĐỘ MỚI — bonus nhẹ
                    if (p.getPostedAt() != null) {
                        long days = Math.max(0, Duration.between(p.getPostedAt().toInstant(), Instant.now()).toDays());
                        double recency = Math.max(0, 1 - (days / 30.0)); // ≤ 30 ngày gần nhất
                        s += recency * 0.2;
                    }

                    return s;
                }


                private String mapBackendStatusToFrontendKey(PropertyStatus beStatus) {
                    if (beStatus == null) return null;
                    switch (beStatus) {
                        case PUBLISHED:      return "active";
                        case PENDING_REVIEW: return "pending";
                        case DRAFT:
                        case ACTIVE:         return "draft";
                        case REJECTED:       return "rejected";
                        case HIDDEN:         return "hidden";
                        case ARCHIVED:       return "archived";
                        case EXPIRED:        return "expired";
                        case EXPIRINGSOON:   return "expiringSoon";
                        case WARNED:         return "warned";
                        default:             return null;
                    }
                }

                private PropertyStatus mapFrontendStatus(String statusKey) {
                    if (statusKey == null) return null;
                    switch (statusKey) {
                        case "rejected":      return PropertyStatus.REJECTED;
                        case "expired":       return PropertyStatus.EXPIRED;
                        case "expiringsoon":  return PropertyStatus.EXPIRINGSOON;
                        default:              return null;
                    }
                }

                private Specification<PropertyEntity> buildStatusSpec(String status) {
                    if (status == null || status.isBlank()) return (r, q, cb) -> cb.conjunction();
                    String key = status.trim().toLowerCase();
                    switch (key) {
                        case "active":
                            return (r, q, cb) -> cb.equal(r.get("status"), PropertyStatus.PUBLISHED);
                        case "pending":
                            return (r, q, cb) -> cb.equal(r.get("status"), PropertyStatus.PENDING_REVIEW);
                        case "draft":
                            return (r, q, cb) -> cb.or(
                                    cb.equal(r.get("status"), PropertyStatus.DRAFT),
                                    cb.equal(r.get("status"), PropertyStatus.ACTIVE)
                            );
                        case "hidden":   return (r, q, cb) -> cb.equal(r.get("status"), PropertyStatus.HIDDEN);
                        case "archived": return (r, q, cb) -> cb.equal(r.get("status"), PropertyStatus.ARCHIVED);
                        case "warned":
                            return (r, q, cb) -> cb.equal(r.get("status"), PropertyStatus.WARNED);
                        default: {
                            PropertyStatus mapped = mapFrontendStatus(key);
                            return (mapped != null)
                                    ? (r, q, cb) -> cb.equal(r.get("status"), mapped)
                                    : (r, q, cb) -> cb.conjunction();
                        }
                    }
                }

                @SuppressWarnings("unchecked")
                private static <X, Y> Join<X, Y> safeLeftJoin(From<X, ?> root, String attr) {
                    try {
                        return (Join<X, Y>) root.join(attr, JoinType.LEFT);
                    } catch (IllegalArgumentException | IllegalStateException e) {
                        return null;
                    }
                }

                private static String trim(String s){
                    return (s == null || s.isBlank()) ? null : s.trim();
                }
                private static Optional<Integer> parseInt(String s){
                    try { return (s == null || s.isBlank()) ? Optional.empty() : Optional.of(Integer.parseInt(s)); }
                    catch (Exception e) { return Optional.empty(); }
                }
                private static Optional<Long> parseLong(String s){
                    try { return (s == null || s.isBlank()) ? Optional.empty() : Optional.of(Long.parseLong(s)); }
                    catch (Exception e) { return Optional.empty(); }
                }
                private static Long tryParseLong(String s){
                    try { return (s == null || s.isBlank()) ? null : Long.valueOf(s); }
                    catch (Exception e){ return null; }
                }

                /* ================= Range helpers for KPI ================= */
                private static class Range { LocalDateTime start, end;
                    Range(LocalDateTime s, LocalDateTime e) { this.start = s; this.end = e; } }

                private Range resolveRange(String key, LocalDate today) {
                    String k = key == null ? "" : key;
                    switch (k) {
                        case "today": {
                            LocalDateTime start = today.atStartOfDay();
                            return new Range(start, start.plusDays(1));
                        }
                        case "last_7d": {
                            LocalDate endDay = today.plusDays(1);
                            return new Range(endDay.minusDays(7).atStartOfDay(), endDay.atStartOfDay());
                        }
                        case "this_month" : {
                            LocalDate first = today.withDayOfMonth(1);
                            return new Range(first.atStartOfDay(), first.plusMonths(1).atStartOfDay());
                        }
                        case "last_month": {
                            LocalDate firstPrev = today.withDayOfMonth(1).minusMonths(1);
                            return new Range(firstPrev.atStartOfDay(), firstPrev.plusMonths(1).atStartOfDay());
                        }
                        case "last_30d":
                        default: {
                            LocalDate endDay = today.plusDays(1);
                            return new Range(endDay.minusDays(30).atStartOfDay(), endDay.atStartOfDay());
                        }
                    }
                }

                private Range previousRange(Range cur) {
                    Duration len = Duration.between(cur.start, cur.end);
                    LocalDateTime prevEnd = cur.start;
                    LocalDateTime prevStart = prevEnd.minus(len);
                    return new Range(prevStart, prevEnd);
                }

                public List<PropertyCardDTO> getBannerListings() {
                    // Lấy 10 tin
                    Pageable pageable = PageRequest.of(0, 5);

                    // ⭐️ GỌI HÀM MỚI (findTopViewedForBanner)
                    List<PropertyEntity> entities = propertyRepository.findTopViewedForBanner(
                            PropertyStatus.PUBLISHED,
                            pageable
                    );

                    // Phần còn lại giữ nguyên
                    return entities.stream()
                            .map(propertyMapper::toPropertyCardDTO) // Chuyển sang DTO
                            .toList();
                }

                @Scheduled(cron = "0 0 * * * ?") // Chạy vào đầu mỗi giờ (0 phút 0 giây)
                @Transactional
                public void handleExpiredListings() {
                    log.info("[ScheduledJob] Running job: Checking for expired listings...");

                    // Lấy thời gian hiện tại
                    Timestamp now = Timestamp.from(Instant.now());

                    // Gọi hàm repository bạn vừa tạo ở Bước 1
                    int count = propertyRepository.updateStatusForExpiredPosts(now);

                    if (count > 0) {
                        log.info("[ScheduledJob] Updated {} listings from PUBLISHED to EXPIRED.", count);
                    } else {
                        log.info("[ScheduledJob] No expired listings found to update.");
                    }
                }
            }
