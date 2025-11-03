package com.backend.be_realestate.modals.request; // (hoặc package của bạn)

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AdminWarningRequest {
    @NotBlank(message = "Nội dung cảnh báo không được để trống")
    @Size(min = 10, message = "Nội dung cảnh báo phải có ít nhất 10 ký tự")
    private String message;
}