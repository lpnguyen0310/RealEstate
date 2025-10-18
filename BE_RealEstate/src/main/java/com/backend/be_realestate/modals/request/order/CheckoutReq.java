package com.backend.be_realestate.modals.request.order;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutReq {
    @NotEmpty
    private List<CheckoutItemReq> items;
    // (để dành) private String returnUrl;
    // (để dành) private InvoiceReq invoice;

}
