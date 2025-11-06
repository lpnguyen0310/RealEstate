package com.backend.be_realestate.entity;

// (import giữ nguyên)
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "package_items",
        // Đổi tên index
        indexes = @Index(name = "idx_package_items_combo_package", columnList = "combo_package_id")
)
public class PackageItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // (Quan hệ cha) Gói Combo chứa mục này
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "combo_package_id", // Đổi tên cột
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_package_items_combo_package")
    )
    private ListingPackage comboPackage; // Gói combo cha

    // ===== TRƯỜNG MỚI (THAY CHO ENUM) =====
    // (Quan hệ con) Mục này trỏ đến một Gói Lẻ khác
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "child_package_id", // Cột mới
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_package_items_child_package")
    )
    private ListingPackage childPackage; // Gói lẻ được chọn (VD: "Gói VIP Mới")

    // ===== BỎ TRƯỜNG NÀY ĐI =====
    // @Enumerated(EnumType.STRING)
    // @Column(name="listing_type", nullable=false, length=16)
    // private ListingType listingType;

    // (Vẫn giữ số lượng)
    @Column(name="quantity", nullable=false)
    private Integer quantity;
}