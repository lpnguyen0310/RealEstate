package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.*;
import com.backend.be_realestate.modals.response.*;

import com.backend.be_realestate.service.AuthService;
import com.backend.be_realestate.service.RegisterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RegisterService registerService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@RequestBody LoginRequest request) {
        TokenResponse tokens = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@RequestBody RefreshRequest request) {
        TokenResponse tokens = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<StartOtpResponse>> requestOtp(
            @Valid @RequestBody RegisterRequestOtp req) {
        return ResponseEntity.ok(ApiResponse.success(
                registerService.startByEmail(req.getEmail())));
    }

    // B2: verify -> trả ticket
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verify(
            @Valid @RequestBody RegisterVerifyOtp req) {
        return ResponseEntity.ok(ApiResponse.success(
                registerService.verifyEmailOtp(req.getEmail(), req.getOtp())));
    }

    // B3: set password -> tạo user
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setPassword(
            @Valid @RequestBody CreatePasswordRequest req) {
        UserDTO dto = registerService.setPasswordAndCreateUser(req);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("message", "Đăng ký thành công", "user", dto)));
    }
}
