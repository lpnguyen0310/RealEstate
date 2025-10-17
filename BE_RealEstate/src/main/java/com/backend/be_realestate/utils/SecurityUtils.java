package com.backend.be_realestate.utils;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepo;

    public Long currentUserId(Authentication auth) {
        if (auth == null) return null;

        Object details = auth.getDetails();
        if (details instanceof java.util.Map<?,?> map && map.get("uid") != null) {
            Object v = map.get("uid");
            return (v instanceof Integer i) ? i.longValue()
                    : (v instanceof Long l) ? l
                    : Long.valueOf(String.valueOf(v));
        }

        String identifier = auth.getName();
        if (identifier != null && !identifier.isBlank()) {
            return userRepo.findByIdentifier(identifier).map(UserEntity::getUserId).orElse(null);
        }
        return null;
    }
}