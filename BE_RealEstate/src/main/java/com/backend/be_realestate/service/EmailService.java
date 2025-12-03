package com.backend.be_realestate.service;

public interface EmailService {
    void sendOtp(String toEmail, String otp, int expireMinutes);

    void sendOTPasswordReset(String toEmail, String otp, int expireMinutes);

    void sendAdminResetPassword(String toEmail, String newPassword);
}
