package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.ForgotPassword.ForgotPasswordResetRequest;
import com.backend.be_realestate.modals.response.StartOtpResponse;
import com.backend.be_realestate.modals.response.VerifyOtpResponse;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.security.register.OtpRecord;
import com.backend.be_realestate.security.register.TicketRecord;
import com.backend.be_realestate.service.EmailService;
import com.backend.be_realestate.service.IPasswordResetService;
import com.github.benmanes.caffeine.cache.Cache;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceInMemoryImpl implements IPasswordResetService {
    private static final int OTP_EXPIRE_MIN = 5;
    private static final int RESEND_COOLDOWN_SEC = 60;
    private static final int MAX_DAILY_SEND = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int TICKET_EXPIRE_MIN = 10;

    private final Cache<String, OtpRecord> otpCache;
    private final Cache<String, TicketRecord> ticketCache;
    private final Cache<String, Integer> otpDailyCounter;
    private final EmailService emailService;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    // ───────────────── helper ─────────────────

    private String genOtp() {
        int code = (int) (Math.random() * 900_000) + 100_000;
        return String.valueOf(code);
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***";
        return email.charAt(0) + "***" + email.substring(at);
    }

    private String dailyKey(String email) {
        String day = Instant.now()
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDate()
                .toString();
        return email + ":" + day;
    }

    // ───────────────── logic ─────────────────

    @Override
    public StartOtpResponse startResetByEmail(String email) {
        // 1) email phải tồn tại (khác với register)
        Optional<UserEntity> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Email không tồn tại trong hệ thống.");
        }

        // 2) limit theo ngày
        String key = dailyKey(email);
        Integer count = otpDailyCounter.getIfPresent(key);
        if (count != null && count >= MAX_DAILY_SEND) {
            throw new IllegalStateException("Bạn đã gửi quá số lần yêu cầu OTP trong ngày.");
        }

        // 3) cooldown 60s
        OtpRecord old = otpCache.getIfPresent(email);
        Instant now = Instant.now();
        if (old != null && old.getLastSentAt() != null &&
                old.getLastSentAt().isAfter(now.minusSeconds(RESEND_COOLDOWN_SEC))) {
            throw new IllegalStateException(
                    "Vui lòng đợi " + RESEND_COOLDOWN_SEC + " giây trước khi gửi lại OTP."
            );
        }

        // 4) tạo OTP mới
        String otp = genOtp();
        OtpRecord rec = OtpRecord.builder()
                .email(email)
                .otp(otp)
                .expiresAt(now.plus(OTP_EXPIRE_MIN, ChronoUnit.MINUTES))
                .attempts(0)
                .lastSentAt(now)
                .sentCountInDay((count == null ? 0 : count) + 1)
                .build();

        otpCache.put(email, rec);
        otpDailyCounter.put(key, rec.getSentCountInDay());

        // 5) gửi email (có thể dùng template riêng cho reset password)
        emailService.sendOTPasswordReset(email, otp, OTP_EXPIRE_MIN);

        return new StartOtpResponse(maskEmail(email), OTP_EXPIRE_MIN * 60, RESEND_COOLDOWN_SEC);
    }

    @Override
    public VerifyOtpResponse verifyResetOtp(String email, String otp) {
        OtpRecord rec = otpCache.getIfPresent(email);
        if (rec == null) {
            throw new IllegalArgumentException("Không tìm thấy yêu cầu OTP cho email này.");
        }
        if (Instant.now().isAfter(rec.getExpiresAt())) {
            throw new IllegalStateException("OTP đã hết hạn.");
        }
        if (rec.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalStateException("Bạn đã nhập sai quá số lần cho phép.");
        }

        rec.setAttempts(rec.getAttempts() + 1);

        if (!rec.getOtp().equals(otp)) {
            otpCache.put(email, rec);
            throw new IllegalArgumentException("OTP không đúng.");
        }

        // OTP đúng → tạo ticket reset password
        String token = UUID.randomUUID().toString();
        TicketRecord ticket = TicketRecord.builder()
                .token(token)
                .email(email)
                .expiresAt(Instant.now().plus(TICKET_EXPIRE_MIN, ChronoUnit.MINUTES))
                .used(false)
                .build();

        ticketCache.put(token, ticket);
        otpCache.invalidate(email);

        return new VerifyOtpResponse(token, TICKET_EXPIRE_MIN * 60);
    }

    @Override
    public void resetPassword(ForgotPasswordResetRequest req) {
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Xác nhận mật khẩu không trùng khớp.");
        }

        // Validate ticket
        TicketRecord ticket = ticketCache.getIfPresent(req.getTicket());
        if (ticket == null) {
            throw new IllegalArgumentException("Ticket không hợp lệ.");
        }
        if (ticket.isUsed() || Instant.now().isAfter(ticket.getExpiresAt())) {
            throw new IllegalStateException("Ticket đã được dùng hoặc đã hết hạn.");
        }

        // Tìm user theo email trong ticket
        UserEntity user = userRepo.findByEmail(ticket.getEmail())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy user tương ứng với ticket."));

        // Option: check độ mạnh mật khẩu ở BE giống regex FE
        String pwd = req.getPassword();
        if (!pwd.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$")) {
            throw new IllegalArgumentException("Mật khẩu không đủ độ mạnh.");
        }

        // Update mật khẩu
        user.setPasswordHash(encoder.encode(pwd));
        userRepo.save(user);

        // Đánh dấu ticket đã dùng
        ticket.setUsed(true);
        ticketCache.put(req.getTicket(), ticket);
    }
}
