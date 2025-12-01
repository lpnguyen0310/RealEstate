package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.AgentProfileDTO;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.ChangePasswordRequest;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.service.UserService;
import com.backend.be_realestate.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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


    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            Authentication auth
    ) {
        Long userId = securityUtils.currentUserId(auth); // GIỮ NGUYÊN HÀM NÀY
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(401, "Chưa đăng nhập", null));
        }

        userService.changePassword(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }
    @GetMapping("/{agentId}")
    public ResponseEntity<AgentProfileDTO> getAgent(@PathVariable Long agentId) {
        AgentProfileDTO dto = userService.getAgentProfile(agentId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{agentId}/properties")
    public ResponseEntity<PageResponse<PropertyCardDTO>> getAgentProperties(
            @PathVariable Long agentId,
            @RequestParam(required = false) String type, // "sell" | "rent" | null
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        var pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "postedAt")
        );

        Page<PropertyCardDTO> dtoPage = userService.getAgentListings(agentId, type, pageable);
        return ResponseEntity.ok(PageResponse.from(dtoPage));
    }
}
