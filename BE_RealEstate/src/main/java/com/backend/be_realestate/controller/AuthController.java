package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.request.LoginRequest;
import com.backend.be_realestate.modals.request.RefreshRequest;
import com.backend.be_realestate.modals.response.TokenResponse;
import com.backend.be_realestate.modals.response.ApiResponse;

import com.backend.be_realestate.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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

}
