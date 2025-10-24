package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.response.AdminUserResponse;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.IAdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements IAdminUserService {
    private final UserRepository userRepo;
    private final PropertyRepository propertyRepo;
    private final UserConverter converter;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> search(String q, String role, String status, int page, int size) {
        role   = ("ALL".equalsIgnoreCase(role))   ? null : role;
        status = ("ALL".equalsIgnoreCase(status)) ? null : status;

        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.max(1, size),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<UserEntity> users = userRepo.searchAdmin(q, role, status, pageable);

        List<AdminUserResponse> content = users.getContent().stream()
                .map(u -> {
                    int postsCount = propertyRepo.countByUser_UserId(u.getUserId());
                    return converter.convertToAdminResponse(u, postsCount);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, users.getTotalElements());
    }

    @Override
    @Transactional
    public void lockUser(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setIsActive(false);
        u.setLockRequested(false);
        userRepo.save(u);
    }

    @Override
    @Transactional
    public void unlockUser(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setIsActive(true);
        userRepo.save(u);
    }

    @Override
    @Transactional
    public void rejectDelete(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setDeleteRequested(false);
        userRepo.save(u);
    }

    @Override
    @Transactional
    public void deleteHard(Long id) {
        if (!userRepo.existsById(id))
            throw new IllegalArgumentException("Người dùng không tồn tại");
        userRepo.deleteById(id);
    }

    @Override
    public void rejectLock(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setLockRequested(false);
        userRepo.save(u);
    }


}
