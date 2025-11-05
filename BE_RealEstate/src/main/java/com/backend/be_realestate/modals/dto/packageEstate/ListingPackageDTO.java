package com.backend.be_realestate.modals.dto.packageEstate;

import lombok.Data;
import java.util.List;

@Data
public class ListingPackageDTO {
    private Long id;
    private String code;
    private String name;
    private String packageType;   // "SINGLE" | "COMBO"
    private String listingType;
    private Double price;           // VND (đơn vị nhỏ nhất) -> tránh dùng Double
    private Integer boostFactor;  // x10, x50...
    private Integer sortOrder;
    private List<PackageItemDTO> items;
    private Boolean isActive;
    private Double priceOriginal;   // Giá gốc (để gạch ngang)
    private Integer durationDays;   // Thời hạn của gói (7, 30 ngày)
    private String highlightTag;    // "Hữu suất", "Lựa chọn nhiều nhất"
    private String description;
}
