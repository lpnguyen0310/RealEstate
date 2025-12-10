package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    // Email đã verify trong SendGrid
    private static final String FROM_EMAIL = "lephuocnguyen.0324@gmail.com";
    private static final String FROM_NAME = "Nexus5 Land Support";

    @Override
    public void sendOtp(String toEmail, String otp, int expireMinutes) {
        String subject = "[RealEstate] Mã xác minh đăng ký";
        String content = "Mã OTP của bạn là: " + otp +
                "\nHiệu lực: " + expireMinutes + " phút.";

        sendEmail(toEmail, subject, content);
    }

    @Override
    public void sendOTPasswordReset(String toEmail, String otp, int expireMinutes) {
        String subject = "[RealEstate] Mã xác minh đặt lại mật khẩu";
        String content = "Mã OTP của bạn là: " + otp +
                "\nHiệu lực: " + expireMinutes + " phút.";

        sendEmail(toEmail, subject, content);
    }

    @Override
    public void sendAdminResetPassword(String toEmail, String newPassword) {
        String subject = "[RealEstate] Mật khẩu của bạn đã được đặt lại";
        String content =
                "Xin chào,\n\n" +
                        "Mật khẩu đăng nhập RealEstate của bạn đã được quản trị viên đặt lại.\n" +
                        "Mật khẩu mới: " + newPassword + "\n\n" +
                        "Vui lòng đăng nhập và đổi sang mật khẩu mới trong mục Tài khoản.\n\n" +
                        "Trân trọng,\nĐội ngũ RealEstate";

        sendEmail(toEmail, subject, content);
    }

    
    private void sendEmail(String toEmail, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            // Helper: hỗ trợ UTF-8, setFrom, setSubject, v.v.
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(text, false);

            // FROM phải trùng 100% email Sender đã verify trong SendGrid
            helper.setFrom(FROM_EMAIL, FROM_NAME);

            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Email sending failed", e);
        }
    }
}
