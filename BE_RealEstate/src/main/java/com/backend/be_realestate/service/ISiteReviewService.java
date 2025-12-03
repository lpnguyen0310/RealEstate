package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.request.SiteReviewCreateRequest;
import com.backend.be_realestate.modals.response.SiteReviewResponse;
import com.backend.be_realestate.modals.response.SiteReviewSummaryResponse;
import com.backend.be_realestate.modals.response.admin.AdminSiteReviewStatsResponse;
import org.springframework.data.domain.Page;

public interface ISiteReviewService {
    SiteReviewResponse createReviewForCurrentUser(SiteReviewCreateRequest request, String source);

    SiteReviewSummaryResponse getPublicSummary(int limit);
    Page<SiteReviewResponse> getAdminReviews(String status, String sentiment, int page, int size);

    SiteReviewResponse updateStatus(Long id, String action);
    AdminSiteReviewStatsResponse getAdminGlobalStats();
}
