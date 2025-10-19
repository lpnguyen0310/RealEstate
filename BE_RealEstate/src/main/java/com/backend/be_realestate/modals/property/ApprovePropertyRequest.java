package com.backend.be_realestate.modals.property;

import com.backend.be_realestate.enums.ListingType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovePropertyRequest {
    private ListingType listingType;   // "NORMAL" | "PREMIUM" | "VIP" (optional)
    private Integer durationDays; // nếu null sẽ dùng duration từ policy
    private String note;          // ghi chú duyệt
}
