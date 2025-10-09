package com.backend.be_realestate.security.register;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class OtpRecord {
    private String email;
    private String otp;            // có thể hash nếu muốn
    private Instant expiresAt;     // +5 phút
    private int attempts;          // max 5
    private Instant lastSentAt;    // cooldown 60s
    private int sentCountInDay;    // max 5/ngày (đếm trong 24h)
    private Instant dayWindowStart;
}
