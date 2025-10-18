package com.backend.be_realestate.modals.dto.order;

import lombok.Data;

@Data
public class OrderItemDTO {
    private String title;
    private String itemType;      // SINGLE | COMBO
    private String listingType;   // NORMAL | VIP | PREMIUM (null nếu COMBO)
    private Long unitPrice;       // VND
    private int qty;              // >= 1
    private Long lineTotal;       // VND
}
