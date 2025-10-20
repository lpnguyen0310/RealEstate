package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.converter.PropertyMapper;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.enums.PropertyType;
import com.backend.be_realestate.exceptions.OutOfStockException;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.IPropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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

    @Override
    public List<PropertyCardDTO> getAllPropertiesForCardView() {
        return propertyRepository.findAll().stream()
                .map(propertyMapper::toPropertyCardDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PropertyDetailDTO getPropertyDetailById(Long id) {
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
        return propertyMapper.toPropertyDetailDTO(entity);
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

        // Map các quan hệ
        var property = new PropertyEntity();
        var user = new UserEntity(); user.setUserId(userId);
        property.setUser(user);

        if (req.getCategoryId() != null) {
            property.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid categoryId")));
        }
        if (req.getCityId() != null) property.setCity(cityRepository.findById(req.getCityId()).orElse(null));
        if (req.getDistrictId() != null) property.setDistrict(districtRepository.findById(req.getDistrictId()).orElse(null));
        if (req.getWardId() != null) property.setWard(wardRepository.findById(req.getWardId()).orElse(null));
        property.setListingTypePolicy(policy);
        // Gán policy
        property.setListingType(policy.getListingType());

        // Trường cơ bản
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

        // Enum nếu FE gửi string
        if (req.getPropertyType() != null) {
            property.setPropertyType(PropertyType.valueOf(req.getPropertyType().name()));
        }
        if (req.getPriceType() != null) {
            property.setPriceType(PriceType.valueOf(req.getPriceType().name()));
        }

        // Status + thời hạn
//        var now = Instant.now();
//        property.setPostedAt(Timestamp.from(now)); // có @CreationTimestamp cũng ok
//        property.setExpiresAt(Timestamp.from(now.plus(policy.getDurationDays(), ChronoUnit.DAYS)));
        property.setStatus(PropertyStatus.PENDING_REVIEW); // hoặc ACTIVE tuỳ quy trình duyệt

        // Ảnh: nếu dùng bảng con PropertyImageEntity
        // vì bạn đã có: @OneToMany(mappedBy="property", cascade=ALL, orphanRemoval=true)
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

        var saved = propertyRepository.save(property);
        return new CreatePropertyResponse(saved.getId(), saved.getStatus());
    }



}
