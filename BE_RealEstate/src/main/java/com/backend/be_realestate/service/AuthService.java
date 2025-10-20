package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.request.LoginRequest;
import com.backend.be_realestate.modals.request.RefreshRequest;
import com.backend.be_realestate.modals.response.TokenResponse;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authManager;
    private final JwtService jwt;
    private final UserRepository userRepo;
    private final UserDetailsService userDetailsService;
    public TokenResponse login(LoginRequest req) {
        String id = req.getIdentifier();
        if (id == null || id.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu email hoặc số điện thoại");
        }

        if (id.contains("@")) {
            boolean exists = userRepo.findByEmail(id).isPresent();
            if (!exists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này chưa được đăng ký");
            }
        }
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(id, req.getPassword())
        );

        UserDetails user = (UserDetails) auth.getPrincipal();
        Long userId = userRepo.findByIdentifier(user.getUsername())
                .map(u -> u.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy user"));
        Map<String,Object> claims = Map.of(
                "uid", userId, //
                "roles", user.getAuthorities().stream().map(a -> a.getAuthority()).toList()
        );
        String access  = jwt.generateAccess(user.getUsername(), claims);
        String refresh = jwt.generateRefresh(user.getUsername());
        return new TokenResponse(access, refresh);
    }

    public TokenResponse refresh(RefreshRequest req) {
        String refreshToken = req.getRefreshToken();
        if (!jwt.isValid(refreshToken) || !jwt.isRefresh(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        String subject = jwt.getSubject(refreshToken);

        UserDetails user = userDetailsService.loadUserByUsername(subject);
        Long userId = userRepo.findByIdentifier(subject)
                .map(u -> u.getUserId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        Map<String,Object> claims = Map.of(
                "uid", userId,
                "roles", user.getAuthorities().stream().map(a -> a.getAuthority()).toList()
        );

        String access  = jwt.generateAccess(subject, claims);
        String refresh = jwt.generateRefresh(subject);
        return new TokenResponse(access, refresh);
    }
}
