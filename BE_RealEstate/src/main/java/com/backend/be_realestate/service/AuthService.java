package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.request.LoginRequest;
import com.backend.be_realestate.modals.request.RefreshRequest;
import com.backend.be_realestate.modals.response.TokenResponse;
import com.backend.be_realestate.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    public TokenResponse login(LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getIdentifier(), req.getPassword())
        );
        UserDetails user = (UserDetails) auth.getPrincipal();
        Map<String,Object> claims = Map.of("roles",
                user.getAuthorities().stream().map(a->a.getAuthority()).toList());
        String access  = jwt.generateAccess(user.getUsername(), claims);
        String refresh = jwt.generateRefresh(user.getUsername());
        return new TokenResponse(access, refresh);
    }

    public TokenResponse refresh(RefreshRequest req) {
        if (!jwt.isValid(req.getRefreshToken()) || !jwt.isRefresh(req.getRefreshToken())) {
            throw new BadCredentialsException("Invalid refresh token");
        }
        String subject = jwt.getSubject(req.getRefreshToken());
        Map<String,Object> claims = Map.of("sub", subject);
        String access  = jwt.generateAccess(subject, claims);
        String refresh = jwt.generateRefresh(subject);
        return new TokenResponse(access, refresh);
    }
}
