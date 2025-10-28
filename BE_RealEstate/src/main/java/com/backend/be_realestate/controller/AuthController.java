package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.*;
import com.backend.be_realestate.modals.response.*;

import com.backend.be_realestate.security.JwtService;
import com.backend.be_realestate.service.AuthService;
import com.backend.be_realestate.service.RegisterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwt;
    private final RegisterService registerService;

    public record AccessOnly(String access) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AccessOnly>> login(@RequestBody LoginRequest req) {
        TokenResponse t = authService.login(req);

        ResponseCookie cookie = ResponseCookie.from("refresh_token", t.getRefreshToken())
                .httpOnly(true)
                .secure(false) //DEV: false, PROD: true
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(jwt.refreshExpMs()))
                .build();

        return ResponseEntity.ok()
                .headers(h -> h.add(HttpHeaders.SET_COOKIE, cookie.toString()))
                .body(ApiResponse.success(new AccessOnly(t.getAccessToken())));
    }

    @PostMapping("/refresh")

    public ResponseEntity<ApiResponse<AccessOnly>> refresh(
            @CookieValue(value = "refresh_token", required = false) String refresh) {

        if (refresh == null)
            throw new BadCredentialsException("Missing refresh token");

        TokenResponse t = authService.refresh(new RefreshRequest(refresh));

        ResponseCookie cookie = ResponseCookie.from("refresh_token", t.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(jwt.refreshExpMs()))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(new AccessOnly(t.getAccessToken())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie clear = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clear.toString())
                .build();
    }

    @PostMapping("/request-otp")
    public ResponseEntity<ApiResponse<StartOtpResponse>> requestOtp(
            @Valid @RequestBody RegisterRequestOtp req) {
        return ResponseEntity.ok(ApiResponse.success(
                registerService.startByEmail(req.getEmail())));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verify(
            @Valid @RequestBody RegisterVerifyOtp req) {
        return ResponseEntity.ok(ApiResponse.success(
                registerService.verifyEmailOtp(req.getEmail(), req.getOtp())));
    }
    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setPassword(
            @Valid @RequestBody CreatePasswordRequest req) {
        UserDTO dto = registerService.setPasswordAndCreateUser(req);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("message", "Đăng ký thành công", "user", dto)));
    }


}
