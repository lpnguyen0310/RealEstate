package com.backend.be_realestate.controller;


import com.backend.be_realestate.modals.request.SiteReviewCreateRequest;
import com.backend.be_realestate.modals.response.SiteReviewResponse;
import com.backend.be_realestate.modals.response.SiteReviewSummaryResponse;
import com.backend.be_realestate.service.ISiteReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/site-reviews")
@RequiredArgsConstructor
public class SiteReviewController {

    private final ISiteReviewService siteReviewService;

    @PostMapping
    public ResponseEntity<SiteReviewResponse> createReview(
            @Valid @RequestBody SiteReviewCreateRequest request
    ) {
        SiteReviewResponse response = siteReviewService
                .createReviewForCurrentUser(request, "POST_SUCCESS_MODAL");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<SiteReviewSummaryResponse> getSummary(
            @RequestParam(defaultValue = "5") int limit
    ) {
        SiteReviewSummaryResponse summary = siteReviewService.getPublicSummary(limit);
        return ResponseEntity.ok(summary);
    }
}