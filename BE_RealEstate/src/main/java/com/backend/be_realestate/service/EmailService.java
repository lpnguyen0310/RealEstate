package com.backend.be_realestate.service;

public interface EmailService {
    void sendOtp(String toEmail, String otp, int expireMinutes);

}
