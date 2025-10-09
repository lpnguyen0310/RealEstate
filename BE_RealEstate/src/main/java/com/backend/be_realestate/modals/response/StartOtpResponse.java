package com.backend.be_realestate.modals.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StartOtpResponse {
    private String emailMasked;
    private int expireSeconds;       // 300
    private int resendAfterSeconds;  // 60
}
