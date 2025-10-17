package com.backend.be_realestate.modals.dto;

import java.math.BigDecimal;
import java.security.Timestamp;


import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyType;
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
    private BigDecimal price;
    private BigDecimal pricePerM2;

    private Float landAreaM2;
    private Float usableAreaM2;

    private PropertyType propertyType;
    private PriceType tradeType;

    private Integer bedrooms;
    private Integer bathrooms;
    private Integer floors;

    private String displayAddress;
    private String addressStreet;
    private String legalStatus;
    private String direction;
    private String description;
    private String position;

    private String status;
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
}
