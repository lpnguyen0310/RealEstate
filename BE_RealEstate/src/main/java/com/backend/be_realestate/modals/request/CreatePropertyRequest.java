package com.backend.be_realestate.modals.request;

import com.backend.be_realestate.enums.PropertyType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePropertyRequest {


    // Bắt buộc tối thiểu
    @NotNull
    private String title;

    @NotNull
    private String description;

    @NotNull
    private PropertyType propertyType;

    @NotNull
    private Long categoryId;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Positive
    private BigDecimal price;

    @NotNull
    private String address;

    @NotNull
    private Long cityId;

    @NotNull
    private Long districtId;

    @NotNull
    private Long wardId;

    @NotNull
    private String addressStreet; // Duong

    private Long numberOfStreet; // So nha\

    @NotNull
    private String direction; // Huong

    @NotNull
    @Positive
    private Double area; // Dien tich

    @NotNull
    @Positive
    private Double width; // Ngang

    @NotNull
    @Positive
    private Double height; // Cao

    @NotNull
    private String legalStatus; // Phap ly

    @NotNull
    private Long floors; // So tang

    @NotNull
    private Long numberOfBathrooms; // So phong tam

    @NotNull
    private Long numberOfBedrooms; // So phong ngu

    @NotNull
    private String position; // Mat tien, hem xe hoi...

    @NotNull
    private List<String> amenities; // Tien ich
    @NotNull
    @Size(min =4, message = "At least 4 images are required")
    private List<String> images; // Hinh anh
    private List<String> videos; // Video




}
