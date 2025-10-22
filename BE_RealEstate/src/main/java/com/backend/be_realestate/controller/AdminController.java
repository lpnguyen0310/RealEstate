package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.response.AdminUserResponse;
import com.backend.be_realestate.modals.response.PropertyShortResponse;
import com.backend.be_realestate.service.AdminPropertyService;
import com.backend.be_realestate.service.IAdminUserService;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin") // Endpoint dành riêng cho admin
public class AdminController {

    @Autowired
    private OrderService orderService;
    private final AdminPropertyService adminPropertyService;
    private final SecurityUtils securityUtils;
    private final IAdminUserService adminUserService;

    // Endpoint này chỉ bạn hoặc admin mới biết để dùng cho việc test
    @PostMapping("/orders/{id}/process-payment")
    public String triggerProcessPaidOrder(@PathVariable Long id) {
        orderService.processPaidOrder(id);
        return "Processed order " + id;
    }



    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/properties/{id}/approve")
    public PropertyShortResponse approve(
            @PathVariable Long id,
            @RequestBody ApprovePropertyRequest req,
            Authentication auth
    ) {
        Long adminId = securityUtils.currentUserId(auth);
        return adminPropertyService.approve(id, req, adminId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/properties/{id}/reject")
    public PropertyShortResponse reject(
            @PathVariable Long id,
            @RequestBody RejectPropertyRequest req,
            Authentication auth
    ) {
        Long adminId = securityUtils.currentUserId(auth);
        return adminPropertyService.reject(id, req, adminId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/properties/{id}/hide")
    public PropertyShortResponse hide(@PathVariable Long id, Authentication auth) {
        Long adminId = securityUtils.currentUserId(auth);
        return adminPropertyService.hide(id, adminId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/properties/{id}/unhide")
    public PropertyShortResponse unhide(@PathVariable Long id, Authentication auth) {
        Long adminId = securityUtils.currentUserId(auth);
        return adminPropertyService.unhide(id, adminId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/properties/{id}")
    public void hardDelete(@PathVariable Long id) {
        adminPropertyService.hardDelete(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/properties")
    public Page<PropertyDTO> listProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String listingType,
            @RequestParam(required = false) String status
    ) {
        return adminPropertyService.search(page, size, q, categoryId, listingType, status);
    }


    // admin user management endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public Page<AdminUserResponse> listUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "1") int page,      // FE đang 1-based
            @RequestParam(defaultValue = "10") int size
    ) {
        return adminUserService.search(q, role, status, page, size);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/lock")
    public void lockUser(@PathVariable Long id) {
        adminUserService.lockUser(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/unlock")
    public void unlockUser(@PathVariable Long id) {
        adminUserService.unlockUser(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/reject-delete")
    public void rejectDeleteRequest(@PathVariable Long id) {
        adminUserService.rejectDelete(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public void deleteUserHard(@PathVariable Long id,
                               @RequestParam(defaultValue = "true") boolean hard) {
        // hiện tại chỉ hỗ trợ hard=true
        adminUserService.deleteHard(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/reject-lock")
    public void rejectLockRequest(@PathVariable Long id) {
        adminUserService.rejectLock(id);
    }

    
}
