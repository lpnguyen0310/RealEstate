package com.backend.be_realestate.modals.response;

import java.time.Instant;

import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyShortResponse {
    private Long id;
    private String status;
    private String listingType;
    private Instant postedAt;
    private Instant expiresAt;
}
