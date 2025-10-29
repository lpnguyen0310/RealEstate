package com.backend.be_realestate.modals.request.order;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutReq {
    @NotEmpty
    private List<CheckoutItemReq> items;
    private String method;
}
