package com.backend.be_realestate.modals.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class NotificationDTO {
    private Long id;
    private String message;
    private String link;
    private boolean isRead;
    private Instant createdAt;
    private String type;
 }
