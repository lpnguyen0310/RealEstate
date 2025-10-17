package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_inventory")
@Data // Lombok để tự tạo getters, setters, etc.
@NoArgsConstructor
public class UserInventoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Loại vật phẩm, ví dụ: "PREMIUM", "VIP".
    // Trùng với ListingType enum để dễ quản lý.
    @Column(name = "item_type", nullable = false)
    private String itemType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}