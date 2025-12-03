package com.backend.be_realestate.modals.ForgotPassword;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordResetRequest {

    @NotBlank
    private String ticket;

    @NotBlank
    private String password;

    @NotBlank
    private String confirmPassword;
}
