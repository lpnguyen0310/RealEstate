package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePasswordRequest {
    @NotBlank
    private String ticket;

    @NotBlank
    @Size(min=8, max=100)
    @Pattern(regexp="^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message="Mật khẩu phải ≥ 8 ký tự, có ít nhất 1 chữ hoa và 1 chữ số")
    private String password;

    @NotBlank
    private String confirmPassword;
}