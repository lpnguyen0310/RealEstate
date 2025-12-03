package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;

    @Override
    public void sendOtp(String toEmail, String otp, int expireMinutes) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("[RealEstate] Mã xác minh đăng ký");
        msg.setText("Mã OTP của bạn là: " + otp + "\nHiệu lực: " + expireMinutes + " phút.");
        mailSender.send(msg);
    }

    @Override
    public void sendOTPasswordReset(String toEmail, String otp, int expireMinutes) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("[RealEstate] Mã xác minh đặt lại mật khẩu");
        msg.setText("Mã OTP của bạn là: " + otp + "\nHiệu lực: " + expireMinutes + " phút.");
        mailSender.send(msg);
    }
}
