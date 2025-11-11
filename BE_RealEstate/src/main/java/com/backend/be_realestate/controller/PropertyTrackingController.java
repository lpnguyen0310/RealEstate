package com.backend.be_realestate.controller;

import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.modals.dto.PotentialCustomerDTO;
import com.backend.be_realestate.modals.request.CreateLeadFormRequest;
import com.backend.be_realestate.service.IPropertyTrackingService;
import com.backend.be_realestate.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
@Slf4j
public class PropertyTrackingController {

    private final IPropertyTrackingService trackingService;
    private final SecurityUtils securityUtils;

    /**
     * API này được gọi khi user click "Chat Zalo" hoặc "Share"
     */
    @PostMapping("/interaction/{propertyId}")
    public ResponseEntity<Void> logInteraction(
            @PathVariable Long propertyId,
            @RequestParam ActivityType type, // Gửi lên ?type=ZALO_CLICK hoặc ?type=SHARE
            Authentication auth,
            HttpServletRequest request
    ) {
        Long userId = securityUtils.currentUserId(auth);
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        try {
            trackingService.logInteraction(propertyId, type, userId, ipAddress, userAgent);
        } catch (Exception e) {
            log.error("Failed to log interaction", e);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * API này được gọi khi user click "Hiện số"
     */
    @PostMapping("/lead/view-phone/{propertyId}")
    public ResponseEntity<Void> createLeadFromViewPhone(
            @PathVariable Long propertyId,
            Authentication auth,
            HttpServletRequest request
    ) {
        Long userId = securityUtils.currentUserId(auth);
        String ipAddress = getClientIp(request);

        try {
            trackingService.createLeadFromViewPhone(propertyId, userId, ipAddress);
        } catch (Exception e) {
            log.error("Failed to create VIEW_PHONE lead", e);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * API này được gọi khi user (thường là khách) GỬI FORM LIÊN HỆ
     */
    @PostMapping("/lead/contact-form/{propertyId}")
    public ResponseEntity<Void> createLeadFromForm(
            @PathVariable Long propertyId,
            @Valid @RequestBody CreateLeadFormRequest formRequest,
            Authentication auth,
            HttpServletRequest request
    ) {
        Long userId = securityUtils.currentUserId(auth);
        String ipAddress = getClientIp(request);

        try {
            trackingService.createLeadFromForm(propertyId, formRequest, userId, ipAddress);
        } catch (Exception e) {
            log.error("Failed to create CONTACT_FORM lead", e);
        }
        return ResponseEntity.ok().build(); // Luôn trả 200OK để FE không bị lỗi
    }

    @GetMapping("/my-leads")
    public ResponseEntity<Page<PotentialCustomerDTO>> getMyLeads(
            Authentication auth,
            @RequestParam(name = "type") String propertyType, // "sell" hoặc "rent"
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        // Gọi service mới để lấy danh sách lead
        Page<PotentialCustomerDTO> leads = trackingService.getMyLeads(userId, propertyType, pageable);
        return ResponseEntity.ok(leads);
    }

    @DeleteMapping("/my-leads/{leadId}")
    public ResponseEntity<Void> deleteLead(
            @PathVariable Long leadId,
            Authentication auth
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build(); // 401 Unauthorized

        try {
            trackingService.deleteLead(leadId, userId);
            return ResponseEntity.ok().build(); // 200 OK
        } catch (AccessDeniedException e) {
            log.warn("User {} tried to delete lead {} without permission", userId, leadId);
            return ResponseEntity.status(403).build(); // 403 Forbidden
        } catch (Exception e) {
            log.error("Error deleting lead {}", leadId, e);
            return ResponseEntity.status(404).build(); // 404 Not Found hoặc lỗi khác
        }
    }

    // Helper lấy IP
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getHeader("X-FORWARDED-FOR");
        if (remoteAddr == null || remoteAddr.isEmpty()) {
            remoteAddr = request.getRemoteAddr();
        }
        return remoteAddr.split(",")[0].trim();
    }
}