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
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public CreatePropertyResponse create(Long userId, CreatePropertyRequest req) {
        var policy = policyRepo.findById(req.getListingTypePolicyId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid listingTypePolicyId"));

        if (policy.getIsActive() == null || policy.getIsActive() == 0L) {
            throw new IllegalStateException("Listing type is inactive");
        }

        var property = new PropertyEntity();

        // luôn load UserEntity thật
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user ID: " + userId));
        property.setUser(user);

        if (req.getCategoryId() != null) {
            property.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid categoryId")));
        }
        if (req.getCityId() != null) property.setCity(cityRepository.findById(req.getCityId()).orElse(null));
        if (req.getDistrictId() != null) property.setDistrict(districtRepository.findById(req.getDistrictId()).orElse(null));
        if (req.getWardId() != null) property.setWard(wardRepository.findById(req.getWardId()).orElse(null));

        property.setListingTypePolicy(policy);
        property.setListingType(policy.getListingType());

        // fields
        property.setTitle(req.getTitle());
        property.setPrice(req.getPrice());
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

        if (req.getPropertyType() != null) {
            property.setPropertyType(PropertyType.valueOf(req.getPropertyType().name()));
        }
        if (req.getPriceType() != null) {
            property.setPriceType(PriceType.valueOf(req.getPriceType().name()));
        }

        property.setStatus(PropertyStatus.PENDING_REVIEW);

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            var imgs = req.getImageUrls().stream().map(url -> {
                var img = new PropertyImageEntity();
                img.setProperty(property);
                img.setImageUrl(url);
                return img;
            }).toList();
            property.setImages(imgs);
        }

        if (req.getAmenityIds() != null && !req.getAmenityIds().isEmpty()) {
            var amenities = amenityRepository.findAllById(req.getAmenityIds());
            property.setAmenities(amenities);
        }

        var saved = propertyRepository.save(property);

        // Gửi thông báo trực tiếp (không dùng event)
        if (saved.getStatus() == PropertyStatus.PENDING_REVIEW) {
            try {
                String title = saved.getTitle() != null ? saved.getTitle() : "không có tiêu đề";

                List<UserEntity> admins = userRepository.findAllByRoles_Code("ADMIN");
                if (!admins.isEmpty()) {
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
                }

                String userMessage = String.format("Tin đăng '%s' của bạn đã được gửi và đang chờ duyệt.", title);
                String userLink = "/dashboard/posts?tab=pending";
                notificationService.createNotification(
                        saved.getUser(),
                        NotificationType.LISTING_PENDING_USER,
                        userMessage,
                        userLink
                );
            } catch (Exception e) {
                log.error("Notify error (listing created OK): {}", e.getMessage(), e);
            }
        }

        return new CreatePropertyResponse(saved.getId(), saved.getStatus());
    }

    /* =========================================================
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

    /* =========================================================
     * RECOMMENDATIONS
     * ========================================================= */
    @Transactional(readOnly = true)
    @Override
    public List<PropertyCardDTO> getRecommendations(Long userId, int limit) {
        List<Long> savedIds = savedPropertyRepository.findPropertyIdsByUser(userId);

        List<Long> favDistrictIds = savedPropertyRepository.topDistrictIds(userId).stream()
                .map(r -> (Long) r[0]).limit(3).toList();

        List<PropertyType> favTypes = savedPropertyRepository.topPropertyTypes(userId).stream()
                .map(r -> (PropertyType) r[0]).limit(3).toList();

        Double avgPrice = null, stdPrice = null, avgArea = null, stdArea = null;
        Object[] stats = savedPropertyRepository.priceAreaStats(userId);
        if (stats != null && stats.length == 4) {
            avgPrice = toD(stats[0]); stdPrice = toD(stats[1]);
            avgArea  = toD(stats[2]); stdArea  = toD(stats[3]);
        }

        boolean noSignal = favDistrictIds.isEmpty() && favTypes.isEmpty()
                && (avgPrice == null || avgPrice <= 0) && (avgArea == null || avgArea <= 0);

        if (noSignal) {
            return propertyRepository.findPopular(PageRequest.of(0, limit)).stream()
                    .map(propertyMapper::toPropertyCardDTO).toList();
        }

        Double priceFrom = null, priceTo = null;
        if (avgPrice != null && avgPrice > 0) {
            double band = Math.max(n0(stdPrice), avgPrice * 0.2);
            priceFrom = Math.max(0, avgPrice - band);
            priceTo   = avgPrice + band;
        }
        Float areaFrom = null, areaTo = null;
        if (avgArea != null && avgArea > 0) {
            double band = Math.max(n0(stdArea), avgArea * 0.2);
            areaFrom = (float) Math.max(0, avgArea - band);
            areaTo   = (float) (avgArea + band);
        }

        Specification<PropertyEntity> spec = Specification.where(RecommendationSpec.statusPublished());
        spec = and(spec, RecommendationSpec.inDistrictIds(favDistrictIds));
        spec = and(spec, RecommendationSpec.inPropertyTypes(favTypes));
        spec = and(spec, RecommendationSpec.priceBetween(priceFrom, priceTo));
        spec = and(spec, RecommendationSpec.areaBetween(areaFrom, areaTo));
        spec = and(spec, RecommendationSpec.notInIds(savedIds));

        int pageSize = Math.max(limit * 3, 24);
        List<PropertyEntity> candidates = propertyRepository
                .findAll(spec, PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "postedAt")))
                .getContent();

        if (candidates.isEmpty()) {
            return propertyRepository.findPopular(PageRequest.of(0, limit)).stream()
                    .map(propertyMapper::toPropertyCardDTO).toList();
        }

        final double pAvg = avgPrice != null ? avgPrice : 0d;
        final double aAvg = avgArea  != null ? avgArea  : 0d;

        List<PropertyEntity> ranked = candidates.stream()
                .sorted((x, y) -> Double.compare(
                        score(y, favDistrictIds, favTypes, pAvg, aAvg),
                        score(x, favDistrictIds, favTypes, pAvg, aAvg)
                ))
                .limit(limit)
                .toList();

        return ranked.stream().map(propertyMapper::toPropertyCardDTO).toList();
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

    /* =========================================================
     * PRIVATE HELPERS
     * ========================================================= */
    private static Specification<PropertyEntity> and(Specification<PropertyEntity> base, Specification<PropertyEntity> next) {
        return next == null ? base : base.and(next);
    }
    private static Double toD(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
    }
    private static double n0(Double d) { return d == null ? 0d : d; }

    private double score(PropertyEntity p,
                         List<Long> favDistrictIds,
                         List<PropertyType> favTypes,
                         double avgPrice,
                         double avgArea) {
        double s = 0;
        if (p.getDistrict() != null && p.getDistrict().getId() != null
                && favDistrictIds.contains(p.getDistrict().getId())) s += 3.0;
        if (p.getPropertyType() != null && favTypes.contains(p.getPropertyType())) s += 2.0;

        if (avgPrice > 0 && p.getPrice() != null && p.getPrice() > 0) {
            double denom = avgPrice * 0.5;
            double close = Math.max(0, 1 - Math.abs(p.getPrice() - avgPrice) / denom);
            s += close * 2.0;
        }
        if (avgArea > 0 && p.getArea() > 0) {
            double denom = avgArea * 0.5;
            double close = Math.max(0, 1 - Math.abs(p.getArea() - avgArea) / denom);
            s += close * 1.5;
        }

        if (p.getListingType() != null) {
            switch (p.getListingType()) {
                case VIP -> s += 0.8;
                case PREMIUM -> s += 1.0;
                default -> {}
            }
        }

        if (p.getPostedAt() != null) {
            long days = Math.max(0, Duration.between(p.getPostedAt().toInstant(), Instant.now()).toDays());
            double recency = Math.max(0, 1 - (days / 30.0));
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
