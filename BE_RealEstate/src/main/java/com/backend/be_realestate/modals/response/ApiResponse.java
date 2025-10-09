package com.backend.be_realestate.modals.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private int code;         // HTTP-like code (200, 400, 401, 500 ...)
    private String message;   // OK / error message
    private T data;           // payload
    private Object errors;    // chi tiết lỗi

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().code(200).message("OK").data(data).build();
    }
    public static ApiResponse<?> fail(int code, String message, Object errors) {
        return ApiResponse.builder().code(code).message(message).errors(errors).build();
    }
}
