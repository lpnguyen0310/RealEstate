package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ListingType;
import jakarta.persistence.*;
import lombok.*;

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
    private ListingType listingType;                 // STANDARD | VIP | PREMIUM

    // Giá/lần đăng của loại tin (Tin thường có thể = 0)
    @Column(nullable=false)
    private Long price;                               // VND

    // Mức độ ưu tiên/đẩy hiển thị (x1/x10/x50...)
    @Column(name="boost_factor")
    private Integer boostFactor;

    // Thời hạn hiển thị
    @Column(name="duration_days", nullable=false)
    private Integer durationDays;                     // 10 | 15 | 20

    // SLA xác thực/duyệt
    @Column(name="verify_sla_minutes", nullable=false)
    private Integer verifySlaMinutes;                 // 240 | 120 | 30

    // Vị trí/độ ưu tiên hiển thị chung
    @Enumerated(EnumType.STRING)
    @Column(name="visibility_level", nullable=false, length=20)
    private VisibilityLevel visibilityLevel;          // DEFAULT | ABOVE_STANDARD | TOP_PAGE

    // Hiển thị thông tin liên hệ
    @Column(name="show_contact_on_detail", nullable=false)
    private Boolean showContactOnDetail;              // true

    @Column(name="show_contact_on_search", nullable=false)
    private Boolean showContactOnSearch;              // false (Standard), true (VIP/Premium)

    // Giới hạn ảnh theo UI (PC/Mobile)
    @Column(name="pc_large",  nullable=false)  private Integer pcLarge;   // Premium: 2
    @Column(name="pc_medium", nullable=false)  private Integer pcMedium;  // 1
    @Column(name="pc_small",  nullable=false)  private Integer pcSmall;   // Std:1, VIP:3, Premium:2

    @Column(name="mobile_large", nullable=false) private Integer mobileLarge; // VIP/Premium:1
    @Column(name="mobile_small", nullable=false) private Integer mobileSmall; // Std:1, Premium:3

    public enum VisibilityLevel { DEFAULT, ABOVE_STANDARD, TOP_PAGE }
}
