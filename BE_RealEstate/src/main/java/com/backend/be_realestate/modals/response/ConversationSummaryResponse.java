package com.backend.be_realestate.modals.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryResponse {
    private Long conversationId;
    private String status;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String subject;
    private String lastMessagePreview;
    private Instant lastMessageAt;
    private Long assigneeId;
    private Integer unreadForAssignee;
    private Integer unreadForCustomer;
}