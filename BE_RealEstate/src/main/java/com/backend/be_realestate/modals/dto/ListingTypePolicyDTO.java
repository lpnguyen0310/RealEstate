package com.backend.be_realestate.modals.dto;

import com.backend.be_realestate.enums.ListingType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingTypePolicyDTO {
    private Long id;
    private ListingType listingType;

    private Long price;
    private Integer boostFactor;

    private Long isActive;

    private Integer durationDays;                     // 10 | 15 | 20
    private Integer verifySlaMinutes;
}
