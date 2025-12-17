package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

        @Entity
        @Table(name = "properties", indexes = {
                @Index(name = "idx_properties_status", columnList = "status"),
                @Index(name = "idx_properties_type", columnList = "property_type"),
                @Index(name = "idx_properties_location", columnList = "city_id, district_id, ward_id"),
                @Index(name = "idx_properties_price", columnList = "price"),
                @Index(name = "idx_properties_user", columnList = "user_id"),
                @Index(name = "idx_properties_area", columnList = "area"),
                @Index(name = "idx_properties_views", columnList = "view_count")
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

            @Column(name = "price", nullable = false)
            private Double price;

            @Column(name = "area", nullable = false)
            private float area; // Diện tích sử dụng

            @Column(name = "bedrooms")
            private Integer bedrooms;

            @Column(name = "bathrooms")
            private Integer bathrooms;

            @Column(name = "address_street", length = 255)
            private String addressStreet;

            @Enumerated(EnumType.STRING)
            @Column(name = "property_type", nullable = false)
            private PropertyType propertyType;

            @Enumerated(EnumType.STRING)
            @Column(name = "pricetype", nullable = false)
            private PriceType priceType;


            @Enumerated(EnumType.STRING)
            @Column(name = "status", nullable = false, length = 32)
            private PropertyStatus status;


            @Column(name = "legal_status", length = 100)
            private String legalStatus;

            @Column(name = "direction", length = 255)
            private String direction;

            @Column(name = "description" , columnDefinition = "TEXT")
            private String description;

            @CreationTimestamp
            @Column(name = "posted_at", updatable = false)
            private Timestamp postedAt;

            @Column(name = "expires_at")
            private Timestamp expiresAt;

            @Column(name = "floors")
            private Integer floors;

            @Column(name = "position", length = 100)
            private String position;         // "Mặt tiền", "Hẻm xe hơi", ...

            @Column(name = "display_address", length = 500)
            private String displayAddress;


            @Column(name = "view_count")
            private Long viewCount = 0L;

            @Formula("(SELECT COALESCE(COUNT(*), 0) FROM saved_properties sp WHERE sp.property_id = id)")
            private Long favoriteCount;

            @Column(name = "landarea")
            private Double landArea; // Diện tích đất


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

            @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
            @org.hibernate.annotations.Where(clause = "image_type = 'PUBLIC'")
            @Builder.Default
            private List<PropertyImageEntity> images = new ArrayList<>();

            public void replaceImages(List<String> urls) { // PUBLIC
                this.images.clear();
                if (urls == null) return;
                int i = 0;
                for (String url : urls) {
                    var img = new PropertyImageEntity();
                    img.setProperty(this);
                    img.setImageUrl(url);
                    img.setDisplayOrder(i++);
                    img.setImageType(PropertyImageEntity.ImageType.PUBLIC);
                    this.images.add(img);
                }
            }


            @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
            @org.hibernate.annotations.Where(clause = "image_type = 'CONSTRUCTION'")
            @Builder.Default
            private List<PropertyImageEntity> constructionImages = new ArrayList<>();

            public void replaceConstructionImages(List<String> urls) { // CONSTRUCTION
                this.constructionImages.clear();
                if (urls == null) return;
                int i = 0;
                for (String url : urls) {
                    var img = new PropertyImageEntity();
                    img.setProperty(this);
                    img.setImageUrl(url);
                    img.setDisplayOrder(i++);
                    img.setImageType(PropertyImageEntity.ImageType.CONSTRUCTION);
                    this.constructionImages.add(img);
                }
            }

            @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
            @org.hibernate.annotations.Where(clause = "image_type = 'LEGAL_DEED'")
            @Builder.Default
            private List<PropertyImageEntity> deedFiles = new ArrayList<>();

            public void replaceDeedFiles(List<String> urls) {
                this.deedFiles.clear();
                if (urls == null) return;
                int i = 0;
                for (String url : urls) {
                    var img = new PropertyImageEntity();
                    img.setProperty(this);
                    img.setImageUrl(url);
                    img.setDisplayOrder(i++);
                    img.setImageType(PropertyImageEntity.ImageType.LEGAL_DEED);
                    this.deedFiles.add(img);
                }
            }

            @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
            @org.hibernate.annotations.Where(clause = "image_type = 'AUTHORIZATION'")
            @Builder.Default
            private List<PropertyImageEntity> authorizationFiles = new ArrayList<>();

            public void replaceAuthorizationFiles(List<String> urls) {
                this.authorizationFiles.clear();
                if (urls == null) return;
                int i = 0;
                for (String url : urls) {
                    var img = new PropertyImageEntity();
                    img.setProperty(this);
                    img.setImageUrl(url);
                    img.setDisplayOrder(i++);
                    img.setImageType(PropertyImageEntity.ImageType.AUTHORIZATION);
                    this.authorizationFiles.add(img);
                }
            }


            @ManyToMany
            @JoinTable(
                    name = "property_amenities",
                    joinColumns = @JoinColumn(name = "property_id"),
                    inverseJoinColumns = @JoinColumn(name = "amenity_id")
            )
            private List<AmenityEntity> amenities ;


            @ManyToOne(fetch = FetchType.LAZY)
            @JoinColumn(name = "listing_type_policy_id", nullable = false)
            private ListingTypePolicy listingTypePolicy;

            @Enumerated(EnumType.STRING)
            @Column(name = "listing_type", nullable = false, length = 16)
            private ListingType listingType;

            @Column(name = "report_count", nullable = false)
            @Builder.Default
            private Integer reportCount = 0;

            @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
            private List<Report> reports;

            @Column(name = "latest_warning_message", length = 1000)
            private String latestWarningMessage;

            @Column(name = "is_owner", nullable = false)
            private Boolean isOwner = Boolean.TRUE;

            @Column(name = "contact_name", length = 255)
            private String contactName;

            @Column(name = "contact_phone", length = 50)
            private String contactPhone;

            @Column(name = "contact_email", length = 255)
            private String contactEmail;
            @Column(name = "contact_relationship", length = 255)
            private String contactRelationship;

            @Column(name = "auto_renew")
            @Builder.Default
            private Boolean autoRenew = false;

            @Enumerated(EnumType.STRING)
            @Column(name = "verification_status", length = 32)
            @Builder.Default
            private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

            // Lưu URL ảnh sổ đỏ (Json string hoặc phân cách bằng dấu phẩy)
            @Column(name = "legal_images", columnDefinition = "TEXT")
            private String legalImages;

            // Điểm tin cậy do AI chấm (0 - 100)
            @Column(name = "verification_score")
            private Double verificationScore;

            // Lưu dữ liệu AI đọc được (JSON) để hiện lên cho Admin so sánh
            @Column(name = "verification_ai_data", columnDefinition = "TEXT")
            private String verificationAiData;
        }