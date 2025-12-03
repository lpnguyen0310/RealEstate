package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.order.AdminOrderDetailDTO;
import com.backend.be_realestate.modals.dto.order.AdminOrderListDTO;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.request.order.AdminOrderBulkReq;
import com.backend.be_realestate.modals.response.*;
import com.backend.be_realestate.modals.response.admin.AdminPropertyStatsResponse;
import com.backend.be_realestate.modals.response.admin.AdminSiteReviewStatsResponse;
import com.backend.be_realestate.modals.response.admin.AdminUsersKpiResponse;
import com.backend.be_realestate.modals.response.admin.NewUsersKpiResponse;
import com.backend.be_realestate.service.*;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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
    private final UserService userService;
    private final ISiteReviewService siteReviewService;

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
    @GetMapping("/properties/stats")
    public AdminPropertyStatsResponse getPropertyStats() {
        return adminPropertyService.getAdminGlobalStats();
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
            @RequestParam(defaultValue = "ALL") String requestType,
            @RequestParam(defaultValue = "1") int page,      // FE đang 1-based
            @RequestParam(defaultValue = "10") int size
    ) {
        return adminUserService.search(q, role, status, requestType, page, size);
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


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users/{id}/reset-password")
    public void resetUserPassword(@PathVariable Long id) {
        adminUserService.resetPasswordByAdmin(id);
    }

    // End admin user management endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/orders")
    public ApiResponse<PageResponse<AdminOrderListDTO>> searchOrders( // <-- SỬA ĐỔI KIỂU TRẢ VỀ TẠI ĐÂY
                                                                      @RequestParam(required = false) String q,
                                                                      @RequestParam(required = false, defaultValue = "ALL") String status,
                                                                      @RequestParam(required = false, defaultValue = "ALL") String method,
                                                                      // Thêm Date Range để giới hạn dữ liệu, giúp tăng hiệu suất
                                                                      @RequestParam(required = false, defaultValue = "LAST_6_MONTHS") String dateRange,
                                                                      @PageableDefault(size = 10, sort = "createdAt,desc") Pageable pageable // Match FE default sort
    ) {
        // Service đã trả về PageResponse<AdminOrderListDTO>
        PageResponse<AdminOrderListDTO> result = orderService.adminSearchOrders(q, status, method, dateRange, pageable);

        // Trả về ApiResponse chứa kiểu DTO mới đã được phân trang
        return ApiResponse.success(result);
    }

    // 2. XEM CHI TIẾT (adminOrdersApi.getById)
    // Endpoint: GET /api/admin/orders/{id}
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/orders/{id}")
    public ApiResponse<AdminOrderDetailDTO> getOrderById(@PathVariable Long id) {

        // SỬA LẠI ĐỂ GỌI HÀM MỚI: getAdminOrderDetail
        AdminOrderDetailDTO detail = orderService.getAdminOrderDetail(id);

        return ApiResponse.success(detail);
    }


    @PostMapping("/orders/{id}/mark-paid")
    public ApiResponse<Void> markPaid(@PathVariable Long id) {
        orderService.adminMarkPaid(id);
        return ApiResponse.success(null);
    }

    // 4. Hủy đơn
    @PostMapping("/orders/{id}/cancel")
    public ApiResponse<Void> cancelOrder(@PathVariable Long id) {
        orderService.adminCancelOrder(id);

        // SỬA: Dùng success(null)
        return ApiResponse.success(null);
    }

    // 5. Hoàn tiền
    @PostMapping("/orders/{id}/refund")
    public ApiResponse<Void> refundOrder(@PathVariable Long id) {
        orderService.adminRefundOrder(id);

        // SỬA: Dùng success(null)
        return ApiResponse.success(null);
    }


    // 6. Bulk Action
    @PostMapping("/orders/bulk-action")
    public ApiResponse<Void> bulkAction(@RequestBody AdminOrderBulkReq req) {
        orderService.adminBulkAction(req.getIds(), req.getAction());
        return ApiResponse.success(null);
    }


    @GetMapping("/site-reviews")
    public ResponseEntity<Page<SiteReviewResponse>> getAdminReviews(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sentiment,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<SiteReviewResponse> result =
                siteReviewService.getAdminReviews(status, sentiment, page, size);

        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/site-reviews/{id}/{action}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long id,
            @PathVariable String action
    ) {
        var updated = siteReviewService.updateStatus(id, action);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/site-reviews/stats")
    public ResponseEntity<AdminSiteReviewStatsResponse> getSiteReviewStats() {
        return ResponseEntity.ok(siteReviewService.getAdminGlobalStats());
    }


    @GetMapping("/users/kpi")
    public ResponseEntity<AdminUsersKpiResponse> getUsersKpi() {
        return ResponseEntity.ok(userService.adminUsersKpi());
    }
}
