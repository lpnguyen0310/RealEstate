package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.ChangePasswordRequest;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private  final UserRepository userRepo;
    private final UserConverter userConverter;
    private final PasswordEncoder passwordEncoder;

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

    private UserEntity findUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }
}
