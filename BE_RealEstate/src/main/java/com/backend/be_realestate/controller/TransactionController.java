package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.TransactionHistoryDTO;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import mới
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // ENDPOINT CHO USER
    @GetMapping("/history")
    public ApiResponse<Page<TransactionHistoryDTO>> getUserHistory(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TransactionHistoryDTO> historyPage = transactionService.getTransactionHistoryForCurrentUser(status, pageable);
        return ApiResponse.success(historyPage);
    }

    // ENDPOINT MỚI CHO ADMIN
    @GetMapping("/admin/history")
    @PreAuthorize("hasRole('ADMIN')") // Yêu cầu quyền ADMIN để truy cập
    public ApiResponse<Page<TransactionHistoryDTO>> getAdminHistory(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TransactionHistoryDTO> historyPage = transactionService.getAllTransactionHistory(status, pageable);
        return ApiResponse.success(historyPage);
    }
}