package com.backend.be_realestate.modals.request;

import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreatePropertyRequest {
    private Long listingTypePolicyId;
    @NotBlank @Size(max = 255)
    private String title;

    private Double price;

    @NotNull(message = "Diện tích (area) là bắt buộc")
    private Float area;

    private Double landArea;

    private Double usableAreaM2;
    private Double width;
    private Double height;
    @NotNull
    private PropertyType propertyType;     // APARTMENT/HOUSE/...
    private PriceType priceType;           // TOTAL / PER_M2 / NEGOTIABLE

   private Integer bedrooms;
    private Integer bathrooms;
    private Integer floors;

    @Size(max = 500) private String displayAddress;
    @Size(max = 255) private String addressStreet;
    @Size(max = 100) private String legalStatus;
    @Size(max = 255) private String direction;
    @Size(max = 2000) private String description;
    @Size(max = 100) private String position;

    private Long cityId;
    private Long districtId;
    private Long wardId;

    private Long categoryId;
    private List<Long> amenityIds;
    private List<String> imageUrls;
    private List<String> constructionImages;
    private Boolean isOwner;             // true: Chính chủ
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String contactRelationship;
}
