package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.TransactionEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {

    /**
     * Tìm một giao dịch dựa trên ID của Payment Intent từ Stripe.
     */
    Optional<TransactionEntity> findByStripePaymentIntentId(String stripePaymentIntentId);

    Page<TransactionEntity> findByStatus(TransactionStatus status, Pageable pageable);

    Page<TransactionEntity> findByOrder_User(UserEntity user, Pageable pageable);
    // PHƯƠNG THỨC BỊ THIẾU MÀ BẠN CẦN THÊM VÀO
    Page<TransactionEntity> findByOrder_UserAndStatus(UserEntity user, TransactionStatus status, Pageable pageable);
}