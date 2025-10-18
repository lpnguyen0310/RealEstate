package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.UserInventoryDTO;
import com.backend.be_realestate.service.UserInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class UserInventoryController {

    private final UserInventoryService inventoryService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserInventory(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Lấy email của người dùng đang đăng nhập từ token
        String userEmail = authentication.getName();

        // Gọi service để lấy dữ liệu
        List<UserInventoryDTO> inventory = inventoryService.getInventoryForUser(userEmail);

        return ResponseEntity.ok(inventory);
    }
}