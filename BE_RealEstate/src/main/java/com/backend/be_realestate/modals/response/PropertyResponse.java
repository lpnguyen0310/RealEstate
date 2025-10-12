package com.backend.be_realestate.modals.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponse {
    // IDs
    private Long id;
    private String code;

    // Core
    private String title;
    private String descriptionJson;
    private String description;
    private String propertyType;     // enum -> String

    // Numeric
    private BigDecimal price;
    private BigDecimal pricePerM2;
    private Float area;
    private Integer bedrooms;
    private Integer bathrooms;
    private Integer floors;
    private Float usableAreaM2;
    private Float landAreaM2;

    // Location
    private String addressMain;      // ghép street, ward, district, city
    private String addressOld;       // nếu cần giữ bản cũ // set modal converter
    private String position;         // "Mặt tiền" / "Hẻm xe hơi" ...
    private String direction;
    private BigDecimal latitude;
    private BigDecimal longitude;

    // Status/meta
    private String status;           // active/pending/...
    private String statusTag;        // "Đang Đăng"/"Chờ Duyệt"/...
    private String listingType;      // normal/premium...
    private Integer views;
    private String createdAt;        // "HH:mm dd/MM/yyyy"
    private String expireDate;       // "yyyy-MM-dd"
    private String areaCode;         // "hn"/"hcm"...

    // Media
    private List<String> images;
    private List<String> videos;

    // Amenities
    private List<String> amenities;

    // Contact (from user)
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String contactZalo;

    // Texts for list-card
    private String priceText;        // "3 tỷ"
    private String unitPriceText;    // "1 tỷ/m²"
    private String landPriceText;    // nếu có
    private String installmentText;  // "Giá góp"
    private String sizeText;         // "3m x 3m"
    private String note;             // "-"
}
