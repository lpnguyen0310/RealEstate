package com.backend.be_realestate.controller.admin;

import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.order.OrderSimpleDTO;
import com.backend.be_realestate.modals.dto.packageEstate.PackageSalesStatsDTO;
import com.backend.be_realestate.modals.dto.propertydashboard.PendingPropertyDTO;
import com.backend.be_realestate.modals.dto.transactions.RecentTransactionDTO;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.NewUsersKpiResponse;
import com.backend.be_realestate.modals.response.admin.OrderKpiResponse;
import com.backend.be_realestate.modals.response.admin.PropertyKpiResponse;
import com.backend.be_realestate.service.IPropertyService;
import com.backend.be_realestate.service.OrderItemService;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/admin/kpi")
@RequiredArgsConstructor
public class AdminKpiController {

    private final UserService userService;
    private final OrderService orderService;
    private final IPropertyService propertyService;
    private final OrderItemService orderItemService;

    @GetMapping("/new-users")
    public ResponseEntity<NewUsersKpiResponse> newUsers(
            @RequestParam(name = "range", defaultValue = "last_30d") String range) {
        return ResponseEntity.ok(userService.newUsersKpi(range));
    }

    @GetMapping("/orders")
    public ResponseEntity<OrderKpiResponse> orders(
            @RequestParam(name = "range", defaultValue = "last_30d") String range,
            @RequestParam(name = "status", defaultValue = "PAID") String status) {
        return ResponseEntity.ok(orderService.ordersKpi(range, status));
    }

    @GetMapping("/properties")
    public ResponseEntity<PropertyKpiResponse> properties(
            @RequestParam(name = "range", defaultValue = "last_30d") String range,
            @RequestParam(name = "status", defaultValue = "PUBLISHED") String status,
            @RequestParam(name = "pendingStatus", defaultValue = "PENDING_REVIEW") String pendingStatus) {
        return ResponseEntity.ok(propertyService.propertiesKpi(range, status, pendingStatus));
    }

    @GetMapping("/properties/pending")
    public ResponseEntity<PageResponse<PendingPropertyDTO>> pendingProperties(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "8") int size
    ) {
        return ResponseEntity.ok(propertyService.findPending(q, page, size));
    }

    @GetMapping("/orders/recent")
    public PageResponse<OrderSimpleDTO> recentOrders(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "8") int size
    ) {
        return orderService.getRecentOrders(q, PageRequest.of(page, size));
    }

    @GetMapping("/orders/recent-transactions")
    public ResponseEntity<List<RecentTransactionDTO>> recentTransactions(
            @RequestParam(defaultValue = "PAID") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "4") int size
    ) {
        List<OrderStatus> statuses = Arrays.stream(status.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> OrderStatus.valueOf(s))
                .toList();

        List<RecentTransactionDTO> data = orderItemService.recentTransactions(statuses, page, size);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/package-stats")
    public ResponseEntity<List<PackageSalesStatsDTO>> getPackageStats(
            @RequestParam(defaultValue = "PAID") String status // "PAID", hoặc "PAID,CANCELLED"...
    ) {
        List<OrderStatus> statuses = Arrays.stream(status.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(OrderStatus::valueOf)
                .toList();

        List<PackageSalesStatsDTO> data = orderItemService.getPackageSalesStats(statuses);
        return ResponseEntity.ok(data);
    }
}