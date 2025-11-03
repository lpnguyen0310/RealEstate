package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.converter.PropertyMapper;
import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.*;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.UserFavoriteDTO;
import com.backend.be_realestate.modals.dto.propertyEvent.PropertyEvent;
import com.backend.be_realestate.modals.dto.propertydashboard.PendingPropertyDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.PropertyKpiResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.repository.specification.PropertySpecification;
import com.backend.be_realestate.service.IPropertyService;
import com.backend.be_realestate.utils.RecommendationSpec;
import io.micrometer.common.lang.Nullable;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
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

    private static final ZoneId ZONE_VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String TZ_OFFSET = "+07:00";

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

        // kwMode: all (mặc định) / any
        boolean matchAll = !"any".equalsIgnoreCase(params.getOrDefault("kwMode", "all"));

        Specification<PropertyEntity> spec =
                PropertySpecification.hasKeyword(keyword, matchAll)
                        .and(PropertySpecification.hasPropertyType(propertyType))
                        .and(PropertySpecification.hasCategorySlug(categorySlug))
                        .and(PropertySpecification.priceBetween(priceFrom, priceTo))
                        .and(PropertySpecification.areaBetween(areaFrom, areaTo));

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

    /* =========================================================
     * DETAILS
     * ========================================================= */
    @Override
    @Transactional
    public PropertyDetailDTO getPropertyDetailById(Long id, Long currentUserId, boolean preview) {
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));

        if (!preview) {
            Long authorId = (entity.getUser() != null) ? entity.getUser().getUserId() : null;
            if (currentUserId == null || !Objects.equals(currentUserId, authorId)) {
                propertyRepository.bumpView(id);
                entity.setViewCount((entity.getViewCount() == null ? 0 : entity.getViewCount()) + 1);
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

        // === Business khác CHỈ khi publish ===
        if (mode == SubmitMode.PUBLISH) {
            // ví dụ: kiểm tra & trừ lượt khi VIP/PREMIUM, set postedAt, duration…
            // consumeQuotaIfNeeded(policy, user);
        }

        var saved = propertyRepository.save(property);

        // notify CHỈ khi publish → PENDING_REVIEW
        if (mode == SubmitMode.PUBLISH && saved.getStatus() == PropertyStatus.PENDING_REVIEW) {
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

        // === 💡 BƯỚC MỚI: LƯU LẠI TRẠNG THÁI GỐC ===
        final PropertyStatus originalStatus = property.getStatus();

        // 2. KIỂM TRA QUYỀN SỞ HỮU
        if (property.getUser() == null || !Objects.equals(property.getUser().getUserId(), userId)) {
            throw new AccessDeniedException("Bạn không có quyền sửa tin này");
        }

        // 3. CẬP NHẬT GÓI TIN (NẾU CÓ)
        if (req.getListingTypePolicyId() != null) {
            var policy = policyRepo.findById(req.getListingTypePolicyId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid listingTypePolicyId"));
            if (policy.getIsActive() == null || policy.getIsActive() == 0L) {
                throw new IllegalStateException("Listing type is inactive");
            }
            property.setListingTypePolicy(policy);
            property.setListingType(policy.getListingType());
        }

        // 4. ÁP DỤNG CÁC TRƯỜNG CÒN LẠI TỪ REQUEST
        applyRequestToEntity(property, req, /*createMode*/ false, /*mode*/ (mode == null ? null : mode));

        // 5. XỬ LÝ LOGIC TRẠNG THÁI VÀ GỬI THÔNG BÁO
        if (mode == SubmitMode.PUBLISH) {

            // Luôn set về PENDING_REVIEW khi nhấn "publish"
            property.setStatus(PropertyStatus.PENDING_REVIEW);

            // === 💡 BẮT ĐẦU LOGIC GỬI THÔNG BÁO (COPY TỪ HÀM CREATE VÀ SỬA LẠI) ===
            try {
                String title = (property.getTitle() != null) ? property.getTitle() : "không có tiêu đề";

                // 5.1 Gửi thông báo cho Admin (DỰA TRÊN TRẠNG THÁI GỐC)
                var admins = userRepository.findAllByRoles_Code("ADMIN");
                if (!admins.isEmpty()) {

                    String adminMessage;
                    NotificationType adminNotificationType;

                    // === 💡 ĐÂY LÀ LOGIC BẠN YÊU CẦU ===
                    if (originalStatus == PropertyStatus.WARNED || originalStatus == PropertyStatus.REJECTED) {
                        // Nếu sửa từ bài bị Cảnh cáo hoặc Từ chối
                        adminMessage = String.format("Tin '%s' (ID: %d) vừa được sửa (từ %s) và đang chờ duyệt lại.",
                                title, property.getId(), originalStatus.name());
                        // Bạn nên tạo type này trong Enum: LISTING_EDITED_PENDING
                        adminNotificationType = NotificationType.LISTING_EDITED_PENDING;
                    } else {
                        // Mặc định, nếu là từ DRAFT
                        adminMessage = String.format("Tin đăng mới '%s' (ID: %d) đang chờ duyệt.",
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
                String userLink = "/dashboard/posts?tab=pending"; // Điều hướng user đến tab Chờ duyệt
                notificationService.createNotification(
                        property.getUser(), NotificationType.LISTING_PENDING_USER, userMessage, userLink
                );

            } catch (Exception e) {
                log.error("Notify error (listing updated OK): {}", e.getMessage(), e);
            }
            // === KẾT THÚC LOGIC GỬI THÔNG BÁO ===

        } else if (mode == SubmitMode.DRAFT) {
            property.setStatus(PropertyStatus.DRAFT);
        }
        // mode == null → giữ nguyên status hiện tại (ví dụ: sửa lỗi chính tả khi đang PUBLISHED)

        // 6. LƯU VÀO DB
        var saved = propertyRepository.save(property);
        return new CreatePropertyResponse(saved.getId(), saved.getStatus());
    }
    private void applyRequestToEntity(PropertyEntity property,
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
        if (req.getAmenityIds() != null) {
            var amenities = req.getAmenityIds().isEmpty()
                    ? java.util.Collections.<AmenityEntity>emptyList()
                    : amenityRepository.findAllById(req.getAmenityIds());
            property.setAmenities(amenities);
        }

        // === Status khi tạo ===
        if (createMode) {
            SubmitMode effective = (mode == null) ? SubmitMode.PUBLISH : mode;
            property.setStatus(effective == SubmitMode.DRAFT ? PropertyStatus.DRAFT : PropertyStatus.PENDING_REVIEW);
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

    /* =========================================================
     * COUNTS (TABS)
     * ========================================================= */
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
        public List<PropertyCardDTO> getRecommendations(Long userId, int limit) {
        log.info("[Reco] userId={}, limit={}", userId, limit);

        // 1) Các tin đã lưu + loại BĐS ưa thích
        List<Long> savedIds = savedPropertyRepository.findPropertyIdsByUser(userId);
        log.info("[Reco] savedIds={}", savedIds);

        List<PropertyType> favTypes = savedPropertyRepository.topPropertyTypes(userId).stream()
                .map(r -> (PropertyType) r[0])  // r[0] là PropertyType
                .limit(3)
                .toList();
        if (favTypes == null || favTypes.isEmpty()) {
            favTypes = List.of(PropertyType.sell, PropertyType.rent);
        } else {
            // gộp thêm 2 loại cơ bản nếu chưa có
            Set<PropertyType> all = new HashSet<>(favTypes);
            all.add(PropertyType.sell);
            all.add(PropertyType.rent);
            favTypes = new ArrayList<>(all);
        }
        final List<PropertyType> finalFavTypes = List.copyOf(favTypes);

        log.info("[Reco] favTypes={}", favTypes);

        // 2) Lấy min/max price & min/max area từ các tin đã lưu
        Double minPrice = null, maxPrice = null;
        Float  minArea  = null, maxArea  = null;

        List<Object[]> rows = savedPropertyRepository.priceAreaMinMax(userId);
        if (rows != null && !rows.isEmpty()) {
            Object[] r = rows.get(0);
            if (r != null && r.length == 4) {
                minPrice = toD(r[0]);
                maxPrice = toD(r[1]);
                Double minAreaD = toD(r[2]);
                Double maxAreaD = toD(r[3]);
                minArea = minAreaD == null ? null : minAreaD.floatValue();
                maxArea = maxAreaD == null ? null : maxAreaD.floatValue();
            }
        }

        /* ⚡ BỔ SUNG: nếu chỉ lưu 1 tin => min == max thì mở dải từ 0 */
        if (minPrice != null && maxPrice != null && minPrice.equals(maxPrice)) {
            minPrice = 0d;
        }
        if (minArea != null && maxArea != null && minArea.equals(maxArea)) {
            minArea = 0f;
        }
        log.info("[Reco] min/max: price[{}, {}], area[{}, {}]", minPrice, maxPrice, minArea, maxArea);

        // 3) Kiểm tra "tín hiệu" — chỉ cần 1 trong 2 hợp lệ (priceOk || areaOk)
        boolean priceOk = (minPrice != null && maxPrice != null && minPrice >= 0 && maxPrice > 0 && minPrice <= maxPrice);
        boolean areaOk  = (minArea  != null && maxArea  != null && minArea  >= 0 && maxArea  > 0  && minArea  <= maxArea);

        if (!(priceOk || areaOk)) {
            log.info("[Reco] noSignal (neither price nor area valid) → return empty list");
            return Collections.emptyList();
        }

        // 4) Build specification: CHỈ CẦN 1 trong 2 (price OR area)
        Specification<PropertyEntity> spec = Specification.where(RecommendationSpec.statusPublished());

        if (!favTypes.isEmpty()) {
            spec = spec.and(RecommendationSpec.inPropertyTypes(favTypes));
        }
        if (!savedIds.isEmpty()) {
            spec = spec.and(RecommendationSpec.notInIds(savedIds));
        }

        Specification<PropertyEntity> priceSpec = null;
        Specification<PropertyEntity> areaSpec  = null;

        if (priceOk) {
            priceSpec = RecommendationSpec.priceBetween(minPrice, maxPrice);
            // Hoặc siết biên trên bằng exclusive:
            // priceSpec = RecommendationSpec.priceBetweenExclusive(minPrice, maxPrice);
        }
        if (areaOk) {
            areaSpec = RecommendationSpec.areaBetween(minArea, maxArea);
            // Hoặc exclusive:
            // areaSpec = RecommendationSpec.areaBetweenExclusive(minArea, maxArea);
        }

        Specification<PropertyEntity> priceOrArea = RecommendationSpec.orSafe(priceSpec, areaSpec);
        spec = spec.and(priceOrArea);

        // 5) Lấy ứng viên (ưu tiên bài mới)
        int pageSize = Math.max(limit * 3, 24);
        List<PropertyEntity> candidates = propertyRepository
                .findAll(spec, PageRequest.of(0, pageSize, Sort.by(DESC, "postedAt")))
                .getContent();

        log.info("[Reco] candidates={}", candidates.stream().map(PropertyEntity::getId).toList());
        if (candidates.isEmpty()) {
            log.info("[Reco] empty candidates → return empty list");
            return Collections.emptyList();
        }

        // 6) Chấm điểm trong phạm vi đã lọc (ưu tiên gần median giá/diện tích)
        final double priceCenter = priceOk ? median(minPrice, maxPrice) : 0d;
        final double areaCenter  = areaOk  ? median(
                minArea  == null ? null : minArea.doubleValue(),
                maxArea  == null ? null : maxArea.doubleValue()
        ) : 0d;

        List<PropertyEntity> ranked = candidates.stream()
                .sorted((x, y) -> Double.compare(
                        scoreRangeAware(y, finalFavTypes, priceCenter, areaCenter),
                        scoreRangeAware(x, finalFavTypes, priceCenter, areaCenter)
                ))
                .limit(limit)
                .toList();

        log.info("[Reco] ranked={}", ranked.stream().map(PropertyEntity::getId).toList());
        return ranked.stream().map(propertyMapper::toPropertyCardDTO).toList();
    }
    private double scoreRangeAware(PropertyEntity p,
                                   List<PropertyType> favTypes,
                                   double priceCenter,
                                   double areaCenter) {
        double s = 0.0;

        // (1) GIÁ — ưu tiên gần "tâm" dải (median)
        if (priceCenter > 0 && p.getPrice() != null && p.getPrice() > 0) {
            double denom = Math.max(1d, priceCenter * 0.25);   // hẹp hơn để sát tâm hơn
            double close = Math.max(0, 1 - Math.abs(p.getPrice() - priceCenter) / denom);
            s += close * 2.4;
        }

        // (2) DIỆN TÍCH — ưu tiên gần "tâm" dải
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

        return s;
    }

    private static double median(Double a, Double b) {
        if (a == null && b == null) return 0d;
        if (a == null) return b;
        if (b == null) return a;
        return (a + b) / 2.0;
    }

    /* =========================================================
     * KPI / PENDING
     * ========================================================= */
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
            case HIDDEN:
            case ARCHIVED:       return "hidden";
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
            case "hidden":
                return (r, q, cb) -> cb.or(
                        cb.equal(r.get("status"), PropertyStatus.HIDDEN),
                        cb.equal(r.get("status"), PropertyStatus.ARCHIVED)
                );
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
}
