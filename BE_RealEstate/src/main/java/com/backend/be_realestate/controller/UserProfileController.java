package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.request.UpdateUserProfileRequest;
import com.backend.be_realestate.modals.response.UserProfileResponse;
import com.backend.be_realestate.service.UserProfileService;
import com.backend.be_realestate.utils.SecurityUtils; // THÊM IMPORT
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; // THÊM IMPORT
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // THÊM IMPORT
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final SecurityUtils securityUtils; // THÊM DEPENDENCY

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            Authentication auth // SỬ DỤNG AUTHENTICATION
    ) {
        // Lấy ID từ SecurityUtils
        Long currentUserId = securityUtils.currentUserId(auth);

        // Kiểm tra xem đã đăng nhập chưa
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfileResponse profileResponse = userProfileService.getUserProfile(currentUserId);
        return ResponseEntity.ok(profileResponse);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @RequestBody UpdateUserProfileRequest request,
            Authentication auth // SỬ DỤNG AUTHENTICATION
    ) {
        // Lấy ID từ SecurityUtils
        Long currentUserId = securityUtils.currentUserId(auth);

        // Kiểm tra xem đã đăng nhập chưa
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfileResponse updatedProfile = userProfileService.updateUserProfile(currentUserId, request);
        return ResponseEntity.ok(updatedProfile);
    }
}

