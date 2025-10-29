package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.enums.OrderType;
import com.backend.be_realestate.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Entity
    @Table(
            name = "orders",
            indexes = {
                    @Index(name = "idx_orders_user", columnList = "user_id")
            }
    )
    public class OrderEntity extends BaseEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        // Chủ đơn
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_user"))
        private UserEntity user;

        @Enumerated(EnumType.STRING)
        @Column(name = "status", length = 20, nullable = false)
        private OrderStatus status = OrderStatus.PENDING_PAYMENT;  // DRAFT|PENDING_PAYMENT|PAID|...

        @Enumerated(EnumType.STRING)
        @Column(name = "method", length = 30, nullable = false)
        private PaymentMethod method; // Không đặt mặc định để buộc phải gán khi tạo

        @Column(name = "currency", length = 10, nullable = false)
        private String currency = "VND";

        // Tiền tệ dùng Long (đơn vị: VND)
        @Column(name = "subtotal", nullable = false)
        private Long subtotal = 0L;

        @Column(name = "discount", nullable = false)
        private Long discount = 0L;

        @Column(name = "total", nullable = false)
        private Long total = 0L;

        @Enumerated(EnumType.STRING)
        @Column(name = "type", length = 30, nullable = false)
        private OrderType type;

        // Quan hệ 1-n với OrderItem
        @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
        @Builder.Default
        private List<OrderItemEntity> items = new ArrayList<>();

        // tiện thao tác
        public void addItem(OrderItemEntity item) {
            items.add(item);
            item.setOrder(this);
        }

        public void removeItem(OrderItemEntity item) {
            items.remove(item);
            item.setOrder(null);
        }
    }
