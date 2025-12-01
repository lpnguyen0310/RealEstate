package com.backend.be_realestate.modals.response.admin;

import lombok.Data;

@Data
public class AdminPropertyStatsResponse {
    private long PENDING_REVIEW;
    private long PUBLISHED;
    private long EXPIRING_SOON;
    private long EXPIRED;
    private long HIDDEN;
    private long REJECTED;
    private long ARCHIVED;
}