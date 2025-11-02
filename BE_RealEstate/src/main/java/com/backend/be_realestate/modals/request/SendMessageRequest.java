package com.backend.be_realestate.modals.request;

import com.backend.be_realestate.modals.dto.AttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class SendMessageRequest {
    private Long conversationId;
    private String content;
    private List<AttachmentDto> attachments;  private String clientMsgId;


}