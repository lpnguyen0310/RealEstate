package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.SiteReviewStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "site_reviews",
        indexes = {
                @Index(name = "idx_site_reviews_created_at", columnList = "created_at"),
                @Index(name = "idx_site_reviews_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteReview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_site_review_user"))
    private UserEntity user;

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1–5

    @Column(name = "comment", length = 1000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private SiteReviewStatus status = SiteReviewStatus.PUBLISHED;

    @Column(name = "source", length = 50)
    private String source; // vd: "POST_SUCCESS_MODAL", "SURVEY", ...
}