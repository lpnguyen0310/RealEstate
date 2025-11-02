package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.TransactionEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.TransactionStatus;
import com.backend.be_realestate.modals.dto.TransactionHistoryDTO;
import com.backend.be_realestate.repository.TransactionRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionHistoryDTO> getAllTransactionHistory(String statusStr, Pageable pageable) {
        Page<TransactionEntity> transactions;

        // Lọc theo trạng thái nếu có, nếu không thì lấy tất cả
        if (statusStr != null && !statusStr.isBlank()) {
            TransactionStatus status = TransactionStatus.valueOf(statusStr.toUpperCase());
            transactions = transactionRepository.findByStatus(status, pageable);
        } else {
            transactions = transactionRepository.findAll(pageable);
        }

        // Chuyển đổi Page<Entity> sang Page<DTO>
        return transactions.map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionHistoryDTO> getTransactionHistoryForCurrentUser(String statusStr, Pageable pageable) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        Page<TransactionEntity> transactions;
        if (statusStr != null && !statusStr.isBlank()) {
            TransactionStatus status = TransactionStatus.valueOf(statusStr.toUpperCase());
            transactions = transactionRepository.findByOrder_UserAndStatus(currentUser, status, pageable);
        } else {
            transactions = transactionRepository.findByOrder_User(currentUser, pageable);
        }
        return transactions.map(this::convertToDto);
    }

    // Hàm helper để chuyển đổi Entity sang DTO và định dạng dữ liệu
    private TransactionHistoryDTO convertToDto(TransactionEntity entity) {

        String stripeId = entity.getStripePaymentIntentId(); // Lấy ID ra trước
        String shortTransactionCode; // Khai báo biến

        // THÊM BƯỚC KIỂM TRA NULL
        if (stripeId == null || stripeId.isEmpty()) {
            // Nếu là giao dịch BALANCE (không có stripeId), gán giá trị mặc định
            shortTransactionCode = "-";
        } else {
            // Chỉ chạy logic cắt chuỗi khi stripeId tồn tại
            shortTransactionCode = stripeId.length() > 6
                    ? stripeId.substring(stripeId.length() - 6)
                    : stripeId;
        }

        return TransactionHistoryDTO.builder()
                .id(String.valueOf(entity.getOrder().getId()))
                .status(translateStatus(entity.getStatus()))
                .type(translateType(entity.getType()))
                .amount(formatAmount(entity.getAmount()))
                .transactionCode(shortTransactionCode) // Sử dụng biến đã được xử lý an toàn
                .reason(entity.getReason() != null ? entity.getReason() : "-")
                .createdAt(entity.getCreatedAt())
                .build();
    }

    // Các hàm định dạng và dịch
    private String translateStatus(TransactionStatus status) {
        return switch (status) {
            case PENDING -> "Đang xử lý";
            case SUCCEEDED -> "Thành công";
            case FAILED -> "Thất bại";
        };
    }

    private String translateType(com.backend.be_realestate.enums.TransactionType type) {
        return switch (type) {
            case PACKAGE_PURCHASE -> "Mua gói";
            case TOP_UP -> "Nạp tiền";
        };
    }

    private String formatAmount(Long amount) {
        if (amount == null) return "0đ";
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return formatter.format(amount); // Ví dụ: 370.000 đ
    }
}