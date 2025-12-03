package com.backend.be_realestate.service;

import com.backend.be_realestate.entity.TransactionEntity;
import com.backend.be_realestate.modals.dto.TransactionHistoryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface TransactionService {
    Page<TransactionHistoryDTO> getAllTransactionHistory(String status, Pageable pageable);
    Page<TransactionHistoryDTO> getTransactionHistoryForCurrentUser(String status, Pageable pageable);
    void markSucceededByOrderId(Long orderId);

}
