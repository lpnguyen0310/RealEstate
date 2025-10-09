package com.backend.be_realestate.security.register;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TicketRecord {
    private String token;        // UUID
    private String email;
    private Instant expiresAt;   // +10 phút
    private boolean used;
}
