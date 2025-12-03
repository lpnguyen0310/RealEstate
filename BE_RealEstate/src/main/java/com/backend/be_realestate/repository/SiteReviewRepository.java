package com.backend.be_realestate.repository;


import com.backend.be_realestate.entity.SiteReview;
import com.backend.be_realestate.enums.SiteReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface SiteReviewRepository extends JpaRepository<SiteReview, Long>, JpaSpecificationExecutor<SiteReview> {

    List<SiteReview> findTop5ByStatusOrderByCreatedAtDesc(SiteReviewStatus status);

    long countByStatus(SiteReviewStatus status);

    @Query("select coalesce(avg(r.rating), 0) from SiteReview r where r.status = :status")
    double findAverageRatingByStatus(SiteReviewStatus status);

    Page<SiteReview> findByStatus(SiteReviewStatus status, Pageable pageable);

    Page<SiteReview> findAll(Pageable pageable);
    long countByCreatedAtAfter(LocalDateTime createdAt);

}
