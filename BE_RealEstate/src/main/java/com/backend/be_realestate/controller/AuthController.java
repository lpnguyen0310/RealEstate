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

        StartOtpResponse res = registerService.startByEmail(req.getEmail());
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verify(
            @Valid @RequestBody RegisterVerifyOtp req) {
        VerifyOtpResponse res = registerService.verifyEmailOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<RegisterCompleteResponse>> complete(
            @Valid @RequestBody RegisterComplete req) {
        UserDTO dto = registerService.completeAndReturnUser(req);
        RegisterCompleteResponse body = new RegisterCompleteResponse("Đăng ký thành công", dto);
        return ResponseEntity.ok(ApiResponse.success(body));
    }
}
