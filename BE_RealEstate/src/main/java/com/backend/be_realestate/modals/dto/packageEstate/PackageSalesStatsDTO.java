package com.backend.be_realestate.modals.dto.packageEstate;

import com.backend.be_realestate.enums.PackageType;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageSalesStatsDTO {
    private Long        packageId;
    private String      code;
    private String      name;
    private PackageType packageType;
    private long        ordersCount;   // số order item
    private long        totalAmount;   // tổng tiền VND
}