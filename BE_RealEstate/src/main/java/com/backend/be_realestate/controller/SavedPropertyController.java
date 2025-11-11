package com.backend.be_realestate.controller;

import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.service.IPropertyTrackingService;
import com.backend.be_realestate.service.savedPost.SavedPropertyService;
import com.backend.be_realestate.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
public class SavedPropertyController {
    private final SavedPropertyService service;
    private final SecurityUtils securityUtils;
    private final IPropertyTrackingService trackingService;
    // === Toggle ===
    @PostMapping("/{propertyId}/toggle")
    public Map<String, Object> toggle(
            @PathVariable Long propertyId,
            Authentication auth,
            HttpServletRequest request // <-- THÊM THAM SỐ NÀY
    ) {
        Long userId = securityUtils.currentUserId(auth);

        // 1. Logic "thích" / "bỏ thích" (giữ nguyên)
        boolean saved = service.toggle(userId, propertyId);

        // 2. === THÊM LOGIC TRACKING SỰ KIỆN ===
        // Chỉ ghi log sự kiện "Thích" (khi 'saved' là true)
        // Không ghi log khi "Bỏ thích" (khi 'saved' là false)
        if (saved) {
            try {
                String ipAddress = getClientIp(request); // Gọi helper
                String userAgent = request.getHeader("User-Agent");

                trackingService.logInteraction(
                        propertyId,
                        ActivityType.FAVORITE, // Dùng type FAVORITE
                        userId,
                        ipAddress,
                        userAgent
                );
            } catch (Exception e) {
                // Ghi log lỗi nhưng không làm hỏng request chính
                log.error("Failed to log FAVORITE interaction for property {}: {}", propertyId, e.getMessage());
            }
        }
        // ==========================================

        return Map.of("saved", saved);
    }

    // === Check ===
    @GetMapping("/check/{propertyId}")
    public Map<String, Object> check(@PathVariable Long propertyId, Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        boolean saved = service.isSaved(userId, propertyId);
        return Map.of("saved", saved);
    }

    @GetMapping("/ids")
    public List<Long> ids(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        return service.listIds(userId);
    }

    @PostMapping("/details")
    public List<PropertyDTO> getFavoriteDetails(@RequestBody List<Long> propertyIds, Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        // Gọi Service mới đã triển khai
        return service.listDetails(userId, propertyIds);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getHeader("X-FORWARDED-FOR");
        if (remoteAddr == null || remoteAddr.isEmpty()) {
            remoteAddr = request.getRemoteAddr();
        }
        return remoteAddr.split(",")[0].trim();
    }
}
