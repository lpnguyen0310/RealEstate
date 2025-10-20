package com.backend.be_realestate.modals.response;

import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import lombok.Data;

import java.util.List;

@Data
public class OrderListResponseDTO {
    private Long orderId;
    private Long userId;
    private String userName;
    private String status;     // PENDING_PAYMENT | PAID | ...
    private Long subtotal;     // VND
    private Long discount;     // VND
    private Long total;        // VND
    private List<OrderItemDTO> items;
    private String createdAt;
}


