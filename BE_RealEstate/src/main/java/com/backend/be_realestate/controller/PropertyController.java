package com.backend.be_realestate.controller;

import com.backend.be_realestate.enums.PropertyAction;
import com.backend.be_realestate.enums.SubmitMode;
import com.backend.be_realestate.modals.RecoResult;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.UserFavoriteDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.request.PropertyActionRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.PropertyActionResponse;
import com.backend.be_realestate.service.IPropertyService;
import com.backend.be_realestate.service.IPropertyTrackingService;
import com.backend.be_realestate.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@Slf4j
public class PropertyController {

    private final IPropertyService propertyService;
    private final SecurityUtils securityUtils;
    private final IPropertyTrackingService trackingService;

    @GetMapping
    public ResponseEntity<Page<PropertyCardDTO>> searchProperties(
            @RequestParam Map<String, String> allParams
    ) {
        Page<PropertyCardDTO> propertyPage = propertyService.searchProperties(allParams);
        return ResponseEntity.ok(propertyPage);
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<PropertyDetailDTO> getPropertyById(@PathVariable Long id) {
//        PropertyDetailDTO propertyDetail = propertyService.getPropertyDetailById(id);
//        return ResponseEntity.ok(propertyDetail);
//    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyDetailDTO> getPropertyById(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam(name = "preview", defaultValue = "false") boolean preview,
            HttpServletRequest request
    ) {
        Long userId = securityUtils.currentUserId(auth); // null nếu chưa đăng nhập
        if (!preview) { // Chỉ log view khi không phải là chế độ xem trước
            try {
                String ipAddress = getClientIp(request); // Lấy IP
                String userAgent = request.getHeader("User-Agent");
                trackingService.logView(id, userId, ipAddress, userAgent);
            } catch (Exception e) {
                // Quan trọng: Không để lỗi tracking làm hỏng API chính
                log.error("Failed to log view for property {}: {}", id, e.getMessage());
            }
        }
        PropertyDetailDTO dto = propertyService.getPropertyDetailById(id, userId, preview);
        return ResponseEntity.ok(dto);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getHeader("X-FORWARDED-FOR");
        if (remoteAddr == null || remoteAddr.isEmpty()) {
            remoteAddr = request.getRemoteAddr();
        }
        // Lấy IP đầu tiên nếu có nhiều IP (X-FORWARDED-FOR)
        return remoteAddr.split(",")[0].trim();
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<PropertyDTO>> getMyProperties(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "postedAt,desc") String sort,
            @RequestParam(required = false) String status,
            @RequestParam Map<String, String> filters // nhận tất cả query params
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        // loại bỏ các param phân trang khỏi filters
        filters.remove("page");
        filters.remove("size");
        filters.remove("sort");
        filters.remove("status");

        String[] s = sort.split(",");
        var dir = (s.length > 1 && s[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        var pageable = PageRequest.of(page, size, Sort.by(dir, s[0]));

        var pageDto = propertyService.getPropertiesByUser(userId, status, pageable, filters);
        return ResponseEntity.ok(PageResponse.from(pageDto));
    }


    @PostMapping("create")
    public ResponseEntity<CreatePropertyResponse> create(
            Authentication authentication,
            @RequestBody CreatePropertyRequest req,
            @RequestParam(name = "mode", required = false) SubmitMode mode
    ) {
        Long userId = securityUtils.currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var effectiveMode = (mode == null) ? SubmitMode.PUBLISHED : mode;
        var res = propertyService.create(userId, req, effectiveMode);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
    @PutMapping("/{id}")
    public ResponseEntity<CreatePropertyResponse> update(
            @PathVariable("id") Long id,
            Authentication authentication,
            @RequestBody CreatePropertyRequest req,
            @RequestParam(name = "mode", required = false) SubmitMode mode
    ) {
        Long userId = securityUtils.currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var res = propertyService.update(userId, id, req, mode);
        return ResponseEntity.ok(res);
    }


    @GetMapping("/my-counts")
    public ResponseEntity<Map<String, Long>> getMyPropertyCounts(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        Map<String, Long> counts = propertyService.getPropertyCountsByStatus(userId);
        return ResponseEntity.ok(counts);
    }


    @GetMapping("/recommendations")
    public ResponseEntity<?> recommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(name = "cityId", required = false) Long anchorCityId,
            @RequestParam(name = "nearCityIds", required = false) List<Long> nearCityIds,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Float minArea,
            @RequestParam(required = false) Float maxArea
    ) {
        // (Optional) làm sạch nearCityIds trùng lặp/chứa anchor:
        if (nearCityIds != null) {
            nearCityIds = nearCityIds.stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .filter(id -> !Objects.equals(id, anchorCityId))
                    .toList();
        }

        RecoResult result = propertyService.getRecommendations(
                userId, limit, anchorCityId, nearCityIds, minPrice, maxPrice, minArea, maxArea
        );

        return ResponseEntity.ok()
                .header("x-reco-source", result.getSource() == null ? "" : result.getSource())
                .body(result);
    }

    @GetMapping("/{id}/favorites")
    public ResponseEntity<List<UserFavoriteDTO>> getPropertyFavorites( // Sửa ResponseEntity<?>
                                                                       @PathVariable Long id,
                                                                       Authentication auth
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        List<UserFavoriteDTO> users = propertyService.getUsersWhoFavorited(id, userId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/banner-listings")
    public ResponseEntity<List<PropertyCardDTO>> getBannerListings() {
        List<PropertyCardDTO> dtos = propertyService.getBannerListings();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/edit/{id}")
    public ResponseEntity<PropertyDTO> getDetailForEdit(
            @PathVariable Long id,
            Authentication auth
    ) {
        // Lấy userId từ token hoặc UserDetails
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PropertyDTO dto = propertyService.getDetailForEdit(id, userId);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<PropertyActionResponse> performAction(
            @PathVariable("id") Long id,
            @RequestBody PropertyActionRequest req,
            Authentication authentication
    ) {
        Long userId = securityUtils.currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (req == null || req.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            var res = propertyService.performAction(userId, id, req.getAction(), req.getNote());
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            // Trạng thái không hợp lệ → 409
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    PropertyActionResponse.builder()
                            .id(id)
                            .newStatus(null)
                            .message(ise.getMessage())
                            .build()
            );
        }
    }

    @PatchMapping("/{id}/auto-renew")
    public ResponseEntity<Void> toggleAutoRenew(
            @PathVariable Long id,
            @RequestParam boolean enable,
            Authentication auth
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            propertyService.toggleAutoRenew(userId, id, enable);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            // Trả về lỗi 400 hoặc 409 nếu trạng thái tin không hợp lệ
            return ResponseEntity.badRequest().build();
        }
    }
}