package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.modals.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

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
}
