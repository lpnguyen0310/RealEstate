package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.TransactionStatus;
import com.backend.be_realestate.enums.TransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * TransactionEntity: Lưu trữ lịch sử của mỗi lần thanh toán.
 * Phiên bản này giả định chỉ sử dụng một loại tiền tệ duy nhất (VNĐ).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Column(name = "stripe_payment_intent_id", nullable = true, unique = true)
    private String stripePaymentIntentId;

    @Column(nullable = false)
    private Long amount; // Vẫn lưu số tiền dưới dạng số nguyên (đồng)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(name = "reason")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}