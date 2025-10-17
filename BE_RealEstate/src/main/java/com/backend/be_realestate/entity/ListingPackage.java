package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.PackageType;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "listing_packages",
        uniqueConstraints = @UniqueConstraint(name = "uk_listing_package_code", columnNames = "code"),
        indexes = @Index(name = "idx_listing_package_active_sort", columnList = "is_active, sort_order")
)
public class ListingPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="code", nullable=false, unique=true, length=60)
    private String code;                   // VD: STD_1, VIP_1, PRM_1, COMBO_FAST

    @Column(name="name", nullable=false, length=120)
    private String name;                   // "Tin VIP", "Combo Tăng tốc"

    @Enumerated(EnumType.STRING)
    @Column(name="package_type", nullable=false, length=16)
    private PackageType packageType;       // SINGLE | COMBO

    @Column(name="price", nullable=false)
    private Double price;                    // VND (đơn vị nhỏ nhất) — FE dùng để cộng tổng

    // ---- chỉ giữ lại boostFactor theo yêu cầu ----
    @Column(name="boost_factor")
    private Integer boostFactor;

    @Enumerated(EnumType.STRING)
    @Column(name="listing_type", length=16)
    private ListingType listingType;// x10, x50... (hiển thị/logic ranking sau này)

    @Column(name="is_active", nullable=false)
    private Boolean isActive = true;

    @Column(name="sort_order", nullable=false)
    private Integer sortOrder = 0;

    // Combo items (rỗng nếu packageType = SINGLE)
    @Builder.Default
    @OneToMany(
            mappedBy = "pkg",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<PackageItem> items = new ArrayList<>();

    public void addItem(PackageItem item) {
        items.add(item);
        item.setPkg(this);
    }
    public void removeItem(PackageItem item) {
        items.remove(item);
        item.setPkg(null);
    }
}
