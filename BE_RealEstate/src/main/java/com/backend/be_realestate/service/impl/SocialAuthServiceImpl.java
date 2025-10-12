package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.AuthProviderEntity;
import com.backend.be_realestate.entity.RoleEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.GoogleProfile;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.repository.AuthProviderRepository;
import com.backend.be_realestate.repository.RoleRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.SocialAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SocialAuthServiceImpl implements SocialAuthService {
    private static final String GOOGLE = "GOOGLE";

    private final UserRepository userRepo;
    private final AuthProviderRepository authProviderRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserConverter userConverter;
    private final RoleRepository roleRepo;
    @Override
    @Transactional
    public UserDTO upsertGoogleUser(GoogleProfile p) {
        // 1) upsert user
        UserEntity user = userRepo.findByEmail(p.getEmail()).orElseGet(() -> {
            UserEntity u = UserEntity.builder()
                    .email(p.getEmail())
                    .firstName(p.getGivenName() != null ? p.getGivenName() : "Nguyễn Văn")
                    .lastName(p.getFamilyName() != null ? p.getFamilyName() : "A")
                    .avatar(p.getPicture())
                    .isActive(true)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .build();
            RoleEntity userRole = roleRepo.findByCode("USER")
                    .orElseThrow(() -> new IllegalStateException("Role USER không tồn tại"));
            u.setRoles(Collections.singletonList(userRole));

            return userRepo.save(u);
        });

        // (optional) cập nhật tên/avatar khi Google có thông tin mới
        boolean dirty = false;
        if (p.getPicture() != null && (user.getAvatar() == null || !p.getPicture().equals(user.getAvatar()))) {
            user.setAvatar(p.getPicture()); dirty = true;
        }
        if (p.getGivenName() != null && (user.getFirstName() == null || !p.getGivenName().equals(user.getFirstName()))) {
            user.setFirstName(p.getGivenName()); dirty = true;
        }
        if (p.getFamilyName() != null && (user.getLastName() == null || !p.getFamilyName().equals(user.getLastName()))) {
            user.setLastName(p.getFamilyName()); dirty = true;
        }
        if (dirty) userRepo.save(user);

        // 2) upsert provider
        AuthProviderEntity provider = authProviderRepo.findByUser(user).orElse(null);
        if (provider == null) {
            authProviderRepo.findByProviderUID(p.getSub()).ifPresent(ap -> {
                if (!ap.getUser().getUserId().equals(user.getUserId())) {
                    throw new IllegalStateException("Google account is already linked to another user");
                }
            });
            provider = AuthProviderEntity.builder()
                    .user(user)
                    .provider(GOOGLE)
                    .providerUID(p.getSub())
                    .build();
        } else {
            provider.setProvider(GOOGLE);
            provider.setProviderUID(p.getSub());
        }
        user.setAuthProvider(provider);
        authProviderRepo.save(provider);

        // 3) về DTO
        return userConverter.convertToDto(user);
    }
}
