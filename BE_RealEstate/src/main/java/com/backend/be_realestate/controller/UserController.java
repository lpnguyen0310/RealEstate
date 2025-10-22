package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.UserService;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.Data;
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> me(Authentication auth) {
        UserDTO dto = userService.getCurrentUser(auth);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/request-lock")
    public ResponseEntity<ApiResponse<Void>> requestLock(Authentication auth,
                                                         @RequestBody LockRequest body) {
        Long userId = securityUtils.currentUserId(auth);    
        userService.requestLock(userId, body.password);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/cancel-lock")
    public ResponseEntity<ApiResponse<Void>> cancelLock(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        userService.cancelLockRequest(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/request-delete")
    public ResponseEntity<ApiResponse<Void>> requestDelete(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        userService.requestDelete(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/cancel-delete")
    public ResponseEntity<ApiResponse<Void>> cancelDelete(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        userService.cancelDeleteRequest(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Data
    public static class LockRequest {
        private String password;
    }

}
