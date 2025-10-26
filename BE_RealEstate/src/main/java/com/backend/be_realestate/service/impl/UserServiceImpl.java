package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.ChangePasswordRequest;
import com.backend.be_realestate.modals.response.admin.NewUsersKpiResponse;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private  final UserRepository userRepo;
    private final UserConverter userConverter;
    private final PasswordEncoder passwordEncoder;
    private static final ZoneId ZONE_VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String TZ_OFFSET = "+07:00";
    @Override
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(Authentication auth) {
        if (auth == null) return null;
        String identifier = auth.getName(); // email hoặc phone
        UserEntity user = userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByPhone(identifier))
                .orElse(null);
        return (user == null) ? null : userConverter.convertToDto(user);
    }

    @Override
    @Transactional
    public void requestLock(Long userId, String currentPassword) {
        UserEntity user = findUser(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác");
        }
        user.setLockRequested(true); // chỉ set flag, chưa khóa thật
        userRepo.save(user);
    }

    @Override
    @Transactional
    public void cancelLockRequest(Long userId) {
        UserEntity user = findUser(userId);
        user.setLockRequested(false);
        userRepo.save(user);
    }

    /* ================== GỬI YÊU CẦU XÓA ================== */
    @Override
    @Transactional
    public void requestDelete(Long userId) {
        UserEntity user = findUser(userId);
        user.setDeleteRequested(true);
        userRepo.save(user);
    }

    @Override
    @Transactional
    public void cancelDeleteRequest(Long userId) {
        UserEntity user = findUser(userId);
        user.setDeleteRequested(false);
        userRepo.save(user);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest req) {
        if(req.getNewPassword() == null || !req.getNewPassword().equals(req.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Xác nhận mật khẩu mới không khớp");
        }

        var user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        // Check password for OAuth-only accounts
        boolean oauthOnly = user.getAuthProvider() != null
                && (user.getPasswordHash() == null || user.getPasswordHash().isBlank());
        if (oauthOnly) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tài khoản đăng nhập bằng mạng xã hội chưa có mật khẩu. Vui lòng dùng 'Quên mật khẩu' để đặt lần đầu."
            );
        }

        // 4) Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }

        // 5) Không cho trùng mật khẩu cũ
        if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        // 6) Mã hoá & lưu
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);

    }

    @Override
    public NewUsersKpiResponse newUsersKpi(String range) {
        // 1. Tính range theo VN time
        LocalDate today = LocalDate.now(ZONE_VN);
        Range cur = resolveRange(range, today);
        Range prev = previousRange(cur);

        // 2. Convert sang UTC
        Instant curStartUtc  = cur.start.atZone(ZONE_VN).toInstant();
        Instant curEndUtc    = cur.end.atZone(ZONE_VN).toInstant();
        Instant prevStartUtc = prev.start.atZone(ZONE_VN).toInstant();
        Instant prevEndUtc   = prev.end.atZone(ZONE_VN).toInstant();

        // 3. Đếm số user
        long totalCurrent = userRepo.countNewUsersBetween(curStartUtc, curEndUtc);
        long totalPrev    = userRepo.countNewUsersBetween(prevStartUtc, prevEndUtc);

        // 4. Lấy dữ liệu từng ngày
        List<Object[]> rows = userRepo.dailyNewUsersSeries(curStartUtc, curEndUtc, TZ_OFFSET);
        Map<LocalDate, Long> filled = new LinkedHashMap<>();
        for (LocalDate d = cur.start.toLocalDate();
             !d.isAfter(cur.end.toLocalDate().minusDays(1));
             d = d.plusDays(1)) {
            filled.put(d, 0L);
        }
        for (Object[] r : rows) {
            LocalDate day = LocalDate.parse(String.valueOf(r[0]));
            long count = ((Number) r[1]).longValue();
            filled.put(day, count);
        }

        // 5. Tính % thay đổi
        double compare = (totalPrev == 0)
                ? (totalCurrent > 0 ? 1.0 : 0.0)
                : ((double) (totalCurrent - totalPrev) / totalPrev);

        // 6. Build DTO trả về
        List<NewUsersKpiResponse.SeriesPoint> series = new ArrayList<>();
        for (Map.Entry<LocalDate, Long> e : filled.entrySet()) {
            series.add(NewUsersKpiResponse.SeriesPoint.builder()
                    .date(e.getKey().toString())
                    .count(e.getValue())
                    .build());
        }

        return NewUsersKpiResponse.builder()
                .summary(NewUsersKpiResponse.Summary.builder()
                        .total(totalCurrent)
                        .compareToPrev(compare)
                        .build())
                .series(series)
                .range(NewUsersKpiResponse.RangeDto.builder()
                        .start(cur.start.toString())
                        .end(cur.end.toString())
                        .build())
                .build();
    }
    private Range resolveRange(String key, LocalDate today) {
        String k = key == null ? "" : key;
        switch (k) {
            case "today": {
                LocalDateTime start = today.atStartOfDay();
                return new Range(start, start.plusDays(1));
            }
            case "last_7d": {
                LocalDate endDay = today.plusDays(1);
                return new Range(endDay.minusDays(7).atStartOfDay(), endDay.atStartOfDay());
            }
            case "this_month": {
                LocalDate first = today.withDayOfMonth(1);
                return new Range(first.atStartOfDay(), first.plusMonths(1).atStartOfDay());
            }
            case "last_month": {
                LocalDate firstPrev = today.withDayOfMonth(1).minusMonths(1);
                return new Range(firstPrev.atStartOfDay(), firstPrev.plusMonths(1).atStartOfDay());
            }
            case "last_30d":
            default: {
                LocalDate endDay = today.plusDays(1);
                return new Range(endDay.minusDays(30).atStartOfDay(), endDay.atStartOfDay());
            }
        }
    }

    private Range previousRange(Range cur) {
        Duration len = Duration.between(cur.start, cur.end);
        LocalDateTime prevEnd = cur.start;
        return new Range(prevEnd.minus(len), prevEnd);
    }
    private static class Range {
        private final LocalDateTime start;
        private final LocalDateTime end;

        private Range(LocalDateTime start, LocalDateTime end) {
            this.start = start;
            this.end = end;
        }
    }

    private UserEntity findUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }
}
