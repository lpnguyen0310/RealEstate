package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.ForgotPassword.ForgotPasswordResetRequest;
import com.backend.be_realestate.modals.response.StartOtpResponse;
import com.backend.be_realestate.modals.response.VerifyOtpResponse;

public interface IPasswordResetService {
    StartOtpResponse startResetByEmail(String email);

    VerifyOtpResponse verifyResetOtp(String email, String otp);

    void resetPassword(ForgotPasswordResetRequest req);
}
