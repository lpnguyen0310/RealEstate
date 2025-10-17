package com.backend.be_realestate.modals.dto.packageEstate;

import lombok.Data;
import java.util.List;

@Data
public class ListingPackageDTO {
    private Long id;
    private String code;
    private String name;
    private String packageType;   // "SINGLE" | "COMBO"
    private Double price;           // VND (đơn vị nhỏ nhất) -> tránh dùng Double
    private Integer boostFactor;  // x10, x50...
    private Integer sortOrder;
    private List<PackageItemDTO> items;
}
