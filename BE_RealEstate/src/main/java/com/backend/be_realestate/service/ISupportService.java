package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.request.CreateConversationRequest;
import com.backend.be_realestate.modals.request.SendMessageRequest;
import com.backend.be_realestate.modals.response.ConversationSummaryResponse;
import com.backend.be_realestate.modals.response.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ISupportService {
    ConversationSummaryResponse createConversation(Long customerId, CreateConversationRequest req);
    Page<ConversationSummaryResponse> list(String tab, Long meId, String q, Pageable pageable);
    Page<MessageResponse> messages(Long conversationId, Pageable pageable);
    MessageResponse send(Long senderId, String senderRole, SendMessageRequest req);
    ConversationSummaryResponse assignToMe(Long conversationId, Long meId);
    void markRead(Long conversationId, String who);

    // ISupportService.java
    void deleteConversation(Long conversationId);

}