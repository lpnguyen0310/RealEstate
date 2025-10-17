package com.backend.be_realestate.modals.request.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutItemReq {
    @NotBlank
    private String code;   // ví dụ: VIP_SINGLE, COMBO_EXP
    @Min(1)
    private int qty;
}
