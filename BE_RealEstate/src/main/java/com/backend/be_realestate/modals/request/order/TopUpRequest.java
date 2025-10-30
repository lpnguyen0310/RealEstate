package com.backend.be_realestate.modals.request.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TopUpRequest {

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 50000, message = "Số tiền nạp tối thiểu là 50,000 VND")
    private Long amount;
}