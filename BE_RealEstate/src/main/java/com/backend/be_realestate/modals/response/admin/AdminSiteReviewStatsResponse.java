package com.backend.be_realestate.modals.response.admin;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AdminSiteReviewStatsResponse {
    private long total;       // tổng tất cả review
    private long published;   // tổng PUBLISHED
    private long hidden;      // tổng HIDDEN
    private long newToday;    // số review tạo mới hôm nay
}