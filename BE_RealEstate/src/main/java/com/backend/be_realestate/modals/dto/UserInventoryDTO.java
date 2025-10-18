package com.backend.be_realestate.modals.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInventoryDTO {

    // Loại vật phẩm, ví dụ: "PREMIUM", "VIP"
    private String itemType;

    // Số lượng vật phẩm người dùng đang có
    private Integer quantity;
}