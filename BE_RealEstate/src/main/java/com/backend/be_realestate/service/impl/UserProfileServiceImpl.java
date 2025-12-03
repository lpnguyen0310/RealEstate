package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.entity.UserProfile;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.converter.UserProfileConverter;
import com.backend.be_realestate.modals.request.UpdateUserProfileRequest;
import com.backend.be_realestate.modals.response.UserProfileResponse;
import com.backend.be_realestate.repository.UserProfileRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileConverter userConverter;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        UserEntity user = findUserById(userId);
        UserProfile profile = getOrCreateUserProfile(user);

        return userConverter.toUserProfileResponse(user, profile);
    }

    @Override
    @Transactional // <-- Annotation này sẽ tự động save khi hàm kết thúc
    public UserProfileResponse updateUserProfile(Long userId, UpdateUserProfileRequest request) {
        // 1. Lấy các đối tượng (managed entities)
        UserEntity user = findUserById(userId);
        UserProfile profile = getOrCreateUserProfile(user);

        userConverter.updateProfileFromRequest(request, user, profile);
        userRepository.save(user);
        return userConverter.toUserProfileResponse(user, profile);
    }

    private UserEntity findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id : '" + userId + "'"));
    }

    private UserProfile getOrCreateUserProfile(UserEntity user) {
        var optProfile = userProfileRepository.findById(user.getUserId());
        if (optProfile.isPresent()) {
            return optProfile.get();
        }

        UserProfile newProfile = UserProfile.builder()
                .user(user)
                .build();

        return userProfileRepository.save(newProfile);
    }
}

