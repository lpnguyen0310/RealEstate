package com.backend.be_realestate.modals.response;

import com.backend.be_realestate.modals.dto.AttachmentDto;
import com.backend.be_realestate.modals.dto.ReactionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long messageId;
    private Long conversationId;
    private Long senderId;
    private String senderRole; // ADMIN | CUSTOMER
    private String content;
    private Instant createdAt;
    private List<AttachmentDto> attachments;
    private String clientMsgId;
    private List<ReactionDto> reactions;

}

