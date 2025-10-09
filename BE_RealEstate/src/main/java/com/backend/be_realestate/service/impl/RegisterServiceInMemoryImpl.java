package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.RegisterComplete;
import com.backend.be_realestate.modals.response.StartOtpResponse;
import com.backend.be_realestate.modals.response.VerifyOtpResponse;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.security.register.OtpRecord;
import com.backend.be_realestate.security.register.TicketRecord;
import com.backend.be_realestate.service.EmailService;
import com.backend.be_realestate.service.RegisterService;
import com.github.benmanes.caffeine.cache.Cache;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegisterServiceInMemoryImpl implements RegisterService {

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
    private final UserConverter userConverter;

    private final SecureRandom random = new SecureRandom();

    private String genOtp() {
        return String.valueOf(random.nextInt(900000) + 100000);
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***";
        return email.charAt(0) + "***" + email.substring(at);
    }

    private String dailyKey(String email) {
        String day = Instant.now().atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate().toString();
        return email + ":" + day;
    }

    @Override
    public StartOtpResponse startByEmail(String email) {
        // 1) email đã có user?
        userRepo.findByEmail(email).ifPresent(u -> {
            throw new IllegalArgumentException("Email đã được sử dụng.");
        });

        // 2) limit theo ngày
        String key = dailyKey(email);
        Integer count = otpDailyCounter.getIfPresent(key);
        if (count != null && count >= MAX_DAILY_SEND) {
            throw new IllegalStateException("Bạn đã gửi quá số lần cho phép trong ngày.");
        }

        // 3) cooldown 60s
        OtpRecord old = otpCache.getIfPresent(email);
        Instant now = Instant.now();
        if (old != null && old.getLastSentAt() != null &&
                old.getLastSentAt().isAfter(now.minusSeconds(RESEND_COOLDOWN_SEC))) {
            throw new IllegalStateException("Vui lòng đợi " + RESEND_COOLDOWN_SEC + " giây để gửi lại.");
        }

        // 4) tạo OTP mới (cache TTL 5')
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

        // 5) gửi email
        emailService.sendOtp(email, otp, OTP_EXPIRE_MIN);

        return new StartOtpResponse(maskEmail(email), OTP_EXPIRE_MIN * 60, RESEND_COOLDOWN_SEC);
    }

    @Override
    public VerifyOtpResponse verifyEmailOtp(String email, String otp) {
        OtpRecord rec = otpCache.getIfPresent(email);
        if (rec == null) throw new IllegalArgumentException("Không tìm thấy yêu cầu OTP.");
        if (Instant.now().isAfter(rec.getExpiresAt())) throw new IllegalStateException("OTP đã hết hạn.");
        if (rec.getAttempts() >= MAX_ATTEMPTS) throw new IllegalStateException("Bạn đã nhập sai quá số lần cho phép.");

        rec.setAttempts(rec.getAttempts() + 1);
        if (!rec.getOtp().equals(otp)) {
            otpCache.put(email, rec);
            throw new IllegalArgumentException("OTP không đúng.");
        }

        // OTP đúng → tạo ticket 10'
        String token = UUID.randomUUID().toString();
        TicketRecord ticket = TicketRecord.builder()
                .token(token)
                .email(email)
                .expiresAt(Instant.now().plus(TICKET_EXPIRE_MIN, ChronoUnit.MINUTES))
                .used(false)
                .build();
        ticketCache.put(token, ticket);

        // xoá OTP để tránh reuse
        otpCache.invalidate(email);

        return new VerifyOtpResponse(token, TICKET_EXPIRE_MIN * 60);
    }

    @Override
    @Deprecated
    public Long complete(RegisterComplete req) {
        var userDto = completeAndReturnUser(req);
        return userDto.getId();
    }

    @Override
    public UserDTO completeAndReturnUser(RegisterComplete req) {
        TicketRecord ticket = ticketCache.getIfPresent(req.getTicket());
        if (ticket == null) throw new IllegalArgumentException("Ticket không hợp lệ.");
        if (ticket.isUsed() || Instant.now().isAfter(ticket.getExpiresAt()))
            throw new IllegalStateException("Ticket đã dùng hoặc hết hạn.");

        userRepo.findByEmail(ticket.getEmail()).ifPresent(u -> {
            throw new IllegalStateException("Email đã tồn tại.");
        });

        UserEntity user = UserEntity.builder()
                .email(ticket.getEmail())
                .phone(req.getPhone())
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .isActive(true)
                .passwordHash(encoder.encode(req.getPassword()))
                .build();

        user = userRepo.save(user);
        ticket.setUsed(true);
        ticketCache.put(req.getTicket(), ticket);
        return userConverter.convertToDto(user);
    }
}