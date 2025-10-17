package com.backend.be_realestate.modals.request;

import com.backend.be_realestate.enums.PriceType;
import com.backend.be_realestate.enums.PropertyType;
import com.backend.be_realestate.enums.TradeType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreatePropertyRequest {

    @NotBlank @Size(max = 255)
    private String title;

    @NotNull @DecimalMin("0.0")
    private BigDecimal price;

    @NotNull(message = "Diện tích (area) là bắt buộc")
    private BigDecimal area;

    @DecimalMin("0.0")
    private BigDecimal landAreaM2;

    @DecimalMin("0.0")
    private BigDecimal usableAreaM2;

    @NotNull
    private PropertyType propertyType;     // APARTMENT/HOUSE/...

    @NotNull(message = "Loại giao dịch (tradeType) là bắt buộc")
    @JsonAlias({"trade_type"})             // nếu FE lỡ gửi trade_type
    private TradeType tradeType;           // SELL / RENT

    @NotNull(message = "priceType là bắt buộc (TOTAL | PER_M2 | NEGOTIABLE)")
    @JsonAlias({"priceUnit", "price_type"}) // hỗ trợ key khác từ FE
    private PriceType priceType;           // TOTAL / PER_M2 / NEGOTIABLE

    @Min(0) private Integer bedrooms;
    @Min(0) private Integer bathrooms;
    @Min(0) private Integer floors;

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

    @Pattern(regexp = "free|vip|premium")
    private String listingType;
}
