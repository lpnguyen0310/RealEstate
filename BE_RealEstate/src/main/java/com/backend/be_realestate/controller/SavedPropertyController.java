package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.service.savedPost.SavedPropertyService;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class SavedPropertyController {
    private final SavedPropertyService service;
    private final SecurityUtils securityUtils;
    // === Toggle ===
    @PostMapping("/{propertyId}/toggle")
    public Map<String, Object> toggle(@PathVariable Long propertyId, Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        boolean saved = service.toggle(userId, propertyId);
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
}
