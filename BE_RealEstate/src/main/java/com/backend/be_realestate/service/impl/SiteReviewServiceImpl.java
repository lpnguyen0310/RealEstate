package com.backend.be_realestate.service.impl;


import com.backend.be_realestate.converter.SiteReviewMapper;
import com.backend.be_realestate.entity.SiteReview;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.enums.SiteReviewStatus;
import com.backend.be_realestate.modals.request.SiteReviewCreateRequest;
import com.backend.be_realestate.modals.response.SiteReviewResponse;
import com.backend.be_realestate.modals.response.SiteReviewSummaryResponse;
import com.backend.be_realestate.modals.response.admin.AdminSiteReviewStatsResponse;
import com.backend.be_realestate.repository.SiteReviewRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.ISiteReviewService;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteReviewServiceImpl implements ISiteReviewService {


    private final SiteReviewRepository siteReviewRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final NotificationServiceImpl notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    @Override
    @Transactional
    public SiteReviewResponse createReviewForCurrentUser(SiteReviewCreateRequest request, String source) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = securityUtils.currentUserId(auth);
        if (currentUserId == null) {
            throw new IllegalStateException("Unauthenticated");
        }

        UserEntity user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        SiteReview entity = SiteReview.builder()
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .source(source)
                .status(SiteReviewStatus.PUBLISHED)
                .build();

        SiteReview saved = siteReviewRepository.save(entity);
        try {
            notifyAdminsNewReview(saved);
            // Optional: bắn WS cho admin FE
            messagingTemplate.convertAndSend("/topic/admin/site-reviews", "new_review");
        } catch (Exception e) {
            log.error("[SiteReview] Error while sending admin notification: {}", e.getMessage(), e);
        }
        return SiteReviewMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SiteReviewSummaryResponse getPublicSummary(int limit) {
        double avg = siteReviewRepository.findAverageRatingByStatus(SiteReviewStatus.PUBLISHED);
        long count = siteReviewRepository.countByStatus(SiteReviewStatus.PUBLISHED);

        List<SiteReview> latest = siteReviewRepository
                .findTop5ByStatusOrderByCreatedAtDesc(SiteReviewStatus.PUBLISHED);

        List<SiteReviewResponse> responses = latest.stream()
                .map(SiteReviewMapper::toResponse)
                .toList();

        return SiteReviewSummaryResponse.builder()
                .averageRating(roundOneDecimal(avg))
                .totalReviews(count)
                .reviews(responses)
                .build();
    }
    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
    @Override
    @Transactional(readOnly = true)
    public Page<SiteReviewResponse> getAdminReviews(String status, String sentiment, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        // 1) Map sentiment → khoảng rating
        Integer minRating = null;
        Integer maxRating = null;

        if (sentiment != null && !sentiment.isBlank()) {
            switch (sentiment.toUpperCase()) {
                case "POSITIVE" -> { // 4–5★
                    minRating = 4;
                    maxRating = 5;
                }
                case "NEUTRAL" -> {  // 3★
                    minRating = 3;
                    maxRating = 3;
                }
                case "NEGATIVE" -> { // 1–2★
                    minRating = 1;
                    maxRating = 2;
                }
                default -> {
                    // nếu FE gửi linh tinh thì coi như không filter sentiment
                }
            }
        }

        // 2) Build Specification: status + rating
        Specification<SiteReview> spec = Specification.where(null);

        if (status != null && !status.isBlank()) {
            SiteReviewStatus st = SiteReviewStatus.valueOf(status.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), st));
        }

        if (minRating != null) {
            Integer finalMin = minRating;
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("rating"), finalMin));
        }

        if (maxRating != null) {
            Integer finalMax = maxRating;
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("rating"), finalMax));
        }

        // 3) Query
        Page<SiteReview> result = siteReviewRepository.findAll(spec, pageable);

        // 4) Map sang response
        return result.map(SiteReviewMapper::toResponse);
    }

    @Override
    public SiteReviewResponse updateStatus(Long id, String action) {
        SiteReview review = siteReviewRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Review not found"));

        switch (action.toLowerCase()) {
            case "show" -> review.setStatus(SiteReviewStatus.PUBLISHED);
            case "hide" -> review.setStatus(SiteReviewStatus.HIDDEN);
            case "delete" -> {
                siteReviewRepository.delete(review);
                return null; // FE reload
            }
            default -> throw new IllegalArgumentException("Invalid action");
        }

        SiteReview saved = siteReviewRepository.save(review);
        return SiteReviewMapper.toResponse(saved);
    }

    @Override
    public AdminSiteReviewStatsResponse getAdminGlobalStats() {
        long total = siteReviewRepository.count();
        long published = siteReviewRepository.countByStatus(SiteReviewStatus.PUBLISHED);
        long hidden = siteReviewRepository.countByStatus(SiteReviewStatus.HIDDEN);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime startOfDay = today.atStartOfDay();

        long newToday = siteReviewRepository.countByCreatedAtAfter(startOfDay);

        return AdminSiteReviewStatsResponse.builder()
                .total(total)
                .published(published)
                .hidden(hidden)
                .newToday(newToday)
                .build();
    }

    // Helpers for notification
    private void notifyAdminsNewReview(SiteReview review) {
        List<UserEntity> admins = userRepository.findAllByRoles_Code("ADMIN");
        if (admins == null || admins.isEmpty()) return;

        String userName = (review.getUser() != null)
                ? (review.getUser().getFirstName() + " " + review.getUser().getLastName()).trim()
                : "Người dùng";

        String msg = String.format(
                "Có đánh giá mới từ %s (%.1f ★): \"%s\"",
                userName,
                review.getRating(),
                review.getComment() != null ? review.getComment() : ""
        );

        String link = "/admin/site-reviews";

        for (UserEntity admin : admins) {
            notificationService.createNotification(
                    admin,
                    NotificationType.SITE_REVIEW_NEW_ADMIN,
                    msg,
                    link
            );
        }
    }

}
