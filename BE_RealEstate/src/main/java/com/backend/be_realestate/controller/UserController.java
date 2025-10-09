package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> me(Authentication auth) {
        UserDTO dto = userService.getCurrentUser(auth);
        return ResponseEntity.ok(ApiResponse.success(dto)); // dto có thể null nếu chưa đăng nhập
    }
}
