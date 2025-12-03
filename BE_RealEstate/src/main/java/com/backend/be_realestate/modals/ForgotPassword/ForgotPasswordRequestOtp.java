package com.backend.be_realestate.modals.ForgotPassword;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequestOtp {

    @NotBlank
    @Email
    private String email;
}