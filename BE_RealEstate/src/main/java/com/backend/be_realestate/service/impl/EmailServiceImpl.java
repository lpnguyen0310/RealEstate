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

    @Override
    public void sendAdminResetPassword(String toEmail, String newPassword) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("[RealEstate] Mật khẩu của bạn đã được đặt lại");
        msg.setText(
                "Xin chào,\n\n" +
                        "Mật khẩu đăng nhập vào hệ thống RealEstate của bạn đã được quản trị viên đặt lại.\n" +
                        "Mật khẩu mới của bạn là: " + newPassword + "\n\n" +
                        "Vui lòng đăng nhập và đổi sang mật khẩu riêng của bạn trong mục Tài khoản.\n\n" +
                        "Trân trọng,\nĐội ngũ RealEstate"
        );
        mailSender.send(msg);
    }
}