package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequestOtp {
    @NotBlank
    @Email
    private String email;
}
