package com.backend.be_realestate.modals.request;

import lombok.Data;

@Data
public class CreateConversationRequest {
    private String subject;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
}