package com.backend.be_realestate.service;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.CreatePasswordRequest;
import com.backend.be_realestate.modals.request.RegisterComplete;
import com.backend.be_realestate.modals.response.StartOtpResponse;
import com.backend.be_realestate.modals.response.VerifyOtpResponse;

public interface RegisterService {
    StartOtpResponse startByEmail(String email);
    VerifyOtpResponse verifyEmailOtp(String email, String otp);
    UserDTO setPasswordAndCreateUser(CreatePasswordRequest req);
}
