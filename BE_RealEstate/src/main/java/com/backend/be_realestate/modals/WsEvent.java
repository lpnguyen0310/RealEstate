package com.backend.be_realestate.modals;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WsEvent {
    private String type;   // message.created / conversation.created / conversation.updated / conversation.assigned
    private Object data;   // MessageResponse hoặc ConversationSummaryResponse
}