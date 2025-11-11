package com.backend.be_realestate.modals.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String message;
    private String link;
    private boolean isRead;
    private Instant createdAt;
    private String type;
    private Long receiverId;

}
