package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.HashSet;
import java.util.List;

@Entity
@Table(name = "properties", indexes = {
        @Index(name = "idx_properties_status", columnList = "status"),
        @Index(name = "idx_properties_type", columnList = "property_type"),
        @Index(name = "idx_properties_location", columnList = "city_id, district_id, ward_id"),
        @Index(name = "idx_properties_price", columnList = "price"),
        @Index(name = "idx_properties_user", columnList = "user_id"),
        @Index(name = "idx_properties_area", columnList = "area")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "price", precision = 18, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "price_per_m2", precision = 18, scale = 2)
    private BigDecimal pricePerM2;

    @Column(name = "area", nullable = false)
    private Float area;

    @Column(name = "bedrooms")
    private Integer bedrooms;

    @Column(name = "bathrooms")
    private Integer bathrooms;

    @Column(name = "address_street", length = 255)
    private String addressStreet;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false)
    private PropertyType propertyType;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "active";

    @Column(name = "listing_type", length = 20, nullable = false)
    private String listingType = "normal";

    @Column(name = "legal_status", length = 100)
    private String legalStatus;

    @Column(name = "direction", length = 255)
    private String direction;

    @Column(name = "description", length = 255)
    private String description;

    @CreationTimestamp
    @Column(name = "posted_at", updatable = false)
    private Timestamp postedAt;

    @Column(name = "expires_at")
    private Timestamp expiresAt;

    @Column(name = "usablearea")
    private Float usableAreaM2;

    @Column(name = "landarea")
    private Float landAreaM2;


    @Column(name = "floors")
    private Integer floors;

    @Column(name = "position", length = 100)
    private String position;         // "Mặt tiền", "Hẻm xe hơi", ...

    @Column(name = "display_address", length = 500)
    private String displayAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false)
    private PriceType tradeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type", nullable = false)
    private PropertyType priceType;

    @Column(name = "width")
    private Double width; // Ngang
    @Column(name = "height")
    private Double height; // Cao

    // --- Relationships ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_properties_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private WardEntity ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private DistrictEntity district;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private CityEntity city;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PropertyImageEntity> images;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PriceHistoryEntity> priceHistories;

    @ManyToMany
    @JoinTable(
            name = "property_amenities",
            joinColumns = @JoinColumn(name = "property_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private List<AmenityEntity> amenities ;
    

}