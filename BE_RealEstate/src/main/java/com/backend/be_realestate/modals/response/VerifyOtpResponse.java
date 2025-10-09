package com.backend.be_realestate.modals.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyOtpResponse {
    private String ticket;           // UUID
    private int ticketExpireSeconds; // 600
}
