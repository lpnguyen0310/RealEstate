package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private UserEntity findUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }
}
