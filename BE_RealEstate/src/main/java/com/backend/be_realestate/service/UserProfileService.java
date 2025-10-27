package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.request.UpdateUserProfileRequest;
import com.backend.be_realestate.modals.response.UserProfileResponse;

public interface UserProfileService {
    UserProfileResponse getUserProfile(Long userId);
    UserProfileResponse updateUserProfile(Long userId, UpdateUserProfileRequest request);
}
