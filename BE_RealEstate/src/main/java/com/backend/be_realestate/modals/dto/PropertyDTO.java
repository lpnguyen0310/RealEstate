package com.backend.be_realestate.modals.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;


import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.enums.PropertyType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyDTO {
    private Long id;
    private String title;
    private Double price;
    private PropertyType propertyType;
    private PriceType priceType;


    private Long bedrooms;
    private Long bathrooms;
    private Long floors;
    private Double area;
    private Double landArea;
    private Double width;
    private Double height;

    private String displayAddress;
    private String addressStreet;
    private String legalStatus;
    private String direction;
    private String description;
    private String position;

    private PropertyStatus status;
    private String listingType;
    private Timestamp postedAt;
    private Timestamp expiresAt;

    private Long userId;
    private Long categoryId;
    private Long cityId;
    private Long districtId;
    private Long wardId;

    private List<String> imageUrls;
    private List<Long> amenityIds;
    private String categoryName;
    private String authorName;
    private String authorEmail;
    private Long durationDays;
    private Long viewCount;
    private Long favoriteCount;
    private List<PropertyAuditDTO> audit; // lịch sử audit để Drawer hiển thị
    private String rejectReason;          // lấy từ audit REJECTED gần nhất
}
