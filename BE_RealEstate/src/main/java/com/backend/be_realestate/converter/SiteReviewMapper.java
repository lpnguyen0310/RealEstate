package com.backend.be_realestate.converter;


import com.backend.be_realestate.entity.SiteReview;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.response.SiteReviewResponse;
import lombok.experimental.UtilityClass;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
@UtilityClass
public class SiteReviewMapper {


    private static final DateTimeFormatter DAY_MONTH_YEAR_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static SiteReviewResponse toResponse(SiteReview entity) {
        UserEntity user = entity.getUser();

        String displayName;
        if (user.getLastName() != null || user.getFirstName() != null) {
            displayName = (safe(user.getLastName()) + " " + safe(user.getFirstName())).trim();
        } else {
            // fallback: lấy phần trước @ của email
            String email = user.getEmail();
            displayName = email != null ? email.split("@")[0] : "Người dùng";
        }

        // createdAt: java.util.Date
        Date createdDate = entity.getCreatedAt();
        String createdAt = "";
        if (createdDate != null) {
            createdAt = createdDate.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                    .format(DAY_MONTH_YEAR_FORMAT);   // 03/03/2025 chẳng hạn
        }

        return SiteReviewResponse.builder()
                .id(entity.getId())
                .name(displayName)
                .phone(safe(user.getPhone()))
                .email(safe(user.getEmail()))
                .rating(entity.getRating())
                .comment(entity.getComment())
                .status(entity.getStatus().name())
                .createdAt(createdAt)
                .build();
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }
}
