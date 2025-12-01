package com.backend.be_realestate.modals.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SiteReviewSummaryResponse {

    private double averageRating;       // ví dụ 4.7
    private long totalReviews;          // tổng số đánh giá
    private List<SiteReviewResponse> reviews; // vài review gần nhất để đẩy ra home
}
