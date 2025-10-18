package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import com.backend.be_realestate.service.OrderItemService;
import com.backend.be_realestate.modals.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-items")
@RequiredArgsConstructor
public class OrderItemController {

    private final OrderItemService orderItemService;

    // FE gọi để lấy danh sách item theo orderId
    @GetMapping("/by-order/{orderId}")
    public ApiResponse<List<OrderItemDTO>> getItemsByOrder(@PathVariable Long orderId) {
        return ApiResponse.success(orderItemService.getItemsByOrder(orderId));
    }
}
