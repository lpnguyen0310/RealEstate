package com.backend.be_realestate.modals.dto.order;

import lombok.Data;
import java.util.List;

@Data
public class OrderDTO {
    private Long orderId;
    private Long userId;
    private String status;     // PENDING_PAYMENT | PAID | ...
    private Long subtotal;     // VND
    private Long discount;     // VND
    private Long total;        // VND
    private List<OrderItemDTO> items;
}
