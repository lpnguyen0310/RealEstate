package com.backend.be_realestate.modals.dto.packageEstate;

import lombok.Data;

@Data
public class PackageItemDTO {
    private Long id;
    private Integer quantity;
    private ListingPackageDTO childPackage;
}
