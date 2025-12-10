package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    // WebClient đã cấu hình trong SendGridConfig
    private final WebClient sendGridWebClient;

    @Value("${sendgrid.sender-email}")
    private String fromEmail;

    @Value("${sendgrid.sender-name}")
    private String fromName;

    @Override
    public void sendOtp(String toEmail, String otp, int expireMinutes) {
        String subject = "[RealEstate] Mã xác minh đăng ký";
        String content =
                "Mã OTP của bạn là: " + otp +
                        "\nHiệu lực: " + expireMinutes + " phút.";
        sendEmail(toEmail, subject, content);
    }

    @Override
    public void sendOTPasswordReset(String toEmail, String otp, int expireMinutes) {
        String subject = "[RealEstate] Mã xác minh đặt lại mật khẩu";
        String content =
                "Mã OTP của bạn là: " + otp +
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
                        "Vui lòng đăng nhập và đổi sang mật khẩu riêng của bạn trong mục Tài khoản.\n\n" +
                        "Trân trọng,\nĐội ngũ RealEstate";
        sendEmail(toEmail, subject, content);
    }

    private void sendEmail(String toEmail, String subject, String text) {
        // Body JSON theo spec SendGrid v3 /mail/send
        Map<String, Object> body = Map.of(
                "from", Map.of(
                        "email", fromEmail,
                        "name", fromName
                ),
                "personalizations", List.of(
                        Map.of(
                                "to", List.of(
                                        Map.of("email", toEmail)
                                ),
                                "subject", subject
                        )
                ),
                "content", List.of(
                        Map.of(
                                "type", "text/plain",
                                "value", text
                        )
                )
        );

        try {
            var response = sendGridWebClient.post()
                    .uri("/mail/send")
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(); // synch cho đơn giản

            HttpStatus status = response != null ? (HttpStatus) response.getStatusCode() : null;
            log.info("SendGrid mail sent to {} with status {}", toEmail, status);

        } catch (WebClientResponseException e) {
            log.error("SendGrid API error when sending email to {}: status={} body={}",
                    toEmail, e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to send email via SendGrid API", e);
        } catch (Exception e) {
            log.error("Unexpected error when sending email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send email via SendGrid API", e);
        }
    }
}
