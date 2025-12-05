package com.backend.be_realestate.modals.request;

import com.backend.be_realestate.enums.ListingType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPropertyBulkReq {
    // Trường bắt buộc cho mọi hành động Bulk
    private List<Long> ids;

    // Trường dùng cho bulk-approve
    private ListingType listingType; // Loại tin nâng cấp đồng loạt
    private Integer durationDays;
    private String note; // Ghi chú Audit cho hành động Approve

    // Trường dùng cho bulk-reject
    private String reason; // Lý do từ chối đồng loạt
}