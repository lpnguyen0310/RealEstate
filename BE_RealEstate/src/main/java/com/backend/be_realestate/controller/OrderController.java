package com.backend.be_realestate.controller;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    // FE gọi để tạo đơn hàng
    @PostMapping("/create")
    public ApiResponse<OrderDTO> create(@RequestBody @Valid CheckoutReq req) {
        return ApiResponse.success(orderService.createOrder(req));
    }

    // FE gọi để lấy chi tiết đơn hàng
    @GetMapping("/{orderId}")
    public ApiResponse<OrderDTO> getOrder(@PathVariable Long orderId) {
        return ApiResponse.success(orderService.getOrderDetail(orderId));
    }

    // FE gọi để lấy danh sách tất cả đơn hàng
    @GetMapping
    public ApiResponse<List<OrderDTO>> getAllOrders() {
        return ApiResponse.success(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<Map<String, Object>>> getMyOrders(Principal principal) {
        String userEmail = principal.getName(); // Chỉ lấy được email/username
        // Phải query DB để lấy ID từ email
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
        Long userId = user.getUserId();

        List<Map<String, Object>> myOrders = orderService.getOrdersByUserId(userId);
        return ApiResponse.success(myOrders);
    }
}
