package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.LoginRequest;
import com.backend.be_realestate.modals.dto.RefreshRequest;
import com.backend.be_realestate.modals.dto.TokenResponse;
import com.backend.be_realestate.security.JwtService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // Đăng nhập
    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );
        String subject = authentication.getName();
        UserDetails user = userDetailsService.loadUserByUsername(subject);
        String access = jwtService.generateAccess(subject, java.util.Map.of(
                "roles", user.getAuthorities().stream().map(a -> a.getAuthority()).toList()
        ));
        String refresh = jwtService.generateRefresh(subject);

        return new TokenResponse(access, refresh);
    }


    // Làm mới token
    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody RefreshRequest req) {
        if (!jwtService.isValid(req.getRefreshToken()) || !jwtService.isRefresh(req.getRefreshToken())) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        String subject = jwtService.getSubject(req.getRefreshToken());
        UserDetails user = userDetailsService.loadUserByUsername(subject);

        String access = jwtService.generateAccess(subject, java.util.Map.of(
                "roles", user.getAuthorities().stream().map(a -> a.getAuthority()).toList()
        ));
        String newRefresh = jwtService.generateRefresh(subject);

        return new TokenResponse(access, newRefresh);
    }

    // Thông tin người dùng hiện tại
    @GetMapping("/me")
    public Object me(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return java.util.Map.of("authenticated", false);
        }
        return java.util.Map.of(
                "authenticated", true,
                "username", authentication.getName(),
                "roles", authentication.getAuthorities()
        );
    }
}
