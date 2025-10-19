package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ListingType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(
        name = "listing_type_policy",
        uniqueConstraints = @UniqueConstraint(name = "uk_policy_listing_type", columnNames = "listing_type")
)
public class ListingTypePolicy extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name="listing_type", nullable=false, length=16)
    private ListingType listingType;

    @Column(nullable=false)
    private Long price;

    @Column(name="boost_factor")
    private Integer boostFactor;

    @Column(name="isactive")
    private Long isActive;

    @Column(name="duration_days", nullable=false)
    private Integer durationDays;                     // 10 | 15 | 20

    // SLA xác thực/duyệt
    @Column(name="verify_sla_minutes", nullable=false)
    private Integer verifySlaMinutes;
    // 240 | 120 | 30
    @OneToMany(mappedBy = "listingTypePolicy", fetch = FetchType.LAZY)
    private List<PropertyEntity> properties;
}
