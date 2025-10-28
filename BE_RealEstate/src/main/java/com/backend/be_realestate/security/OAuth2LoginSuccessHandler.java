package com.backend.be_realestate.security;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.GoogleProfile;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.SocialAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final SocialAuthService socialAuthService;
    private final JwtService jwtService;

    @Value("${app.oauth2.redirect-success:http://localhost:3000/oauth2/callback}")
    private String redirectSuccess;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res,
                                        Authentication authentication) throws IOException {
        OAuth2User p = (OAuth2User) authentication.getPrincipal();

        GoogleProfile profile = GoogleProfile.builder()
                .email((String) p.getAttributes().get("email"))
                .sub((String) p.getAttributes().get("sub"))
                .givenName((String) p.getAttributes().get("given_name"))
                .familyName((String) p.getAttributes().get("family_name"))
                .picture((String) p.getAttributes().get("picture"))
                .build();

        UserDTO dto = socialAuthService.upsertGoogleUser(profile);

        // ✅ Đính kèm uid vào claims
        Map<String, Object> accessClaims = new java.util.HashMap<>();
        accessClaims.put("typ", "access");
        accessClaims.put("uid", dto.getId());
        accessClaims.put("roles", dto.getRoles());


        String access  = jwtService.generateAccess(dto.getEmail(), accessClaims);
        String refresh = jwtService.generateRefresh(dto.getEmail());

        // redirect FE (hoặc set HttpOnly cookie tuỳ chiến lược)
        String target = UriComponentsBuilder.fromHttpUrl(redirectSuccess)
                .queryParam("access", access)
                .queryParam("refresh", refresh)
                .build(true)
                .toUriString();

        getRedirectStrategy().sendRedirect(req, res, target);
    }
}
