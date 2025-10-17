package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ListingType;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "package_items",
        indexes = @Index(name = "idx_package_items_package", columnList = "package_id")
)
public class PackageItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "package_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_package_items_package")
    )
    private ListingPackage pkg;

    @Enumerated(EnumType.STRING)
    @Column(name="listing_type", nullable=false, length=16)
    private ListingType listingType;       // STANDARD | VIP | PREMIUM

    @Column(name="quantity", nullable=false)
    private Integer quantity;              // 5, 10, 3...
}
