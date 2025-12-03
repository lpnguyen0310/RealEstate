package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
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
    private final NotificationServiceImpl notificationService;
    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> search(String q,
                                          String role,
                                          String status,
                                          String requestType,
                                          int page,
                                          int size) {
        role   = ("ALL".equalsIgnoreCase(role))   ? null : role;
        status = ("ALL".equalsIgnoreCase(status)) ? null : status;
        requestType = (requestType == null || "ALL".equalsIgnoreCase(requestType)) ? null : requestType;

        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.max(1, size),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<UserEntity> users = userRepo.searchAdmin(q, role, status, requestType, pageable);

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
        String displayName = buildUserDisplayName(u);
        String msg = String.format(
                "Tài khoản của bạn (%s) đã bị khóa bởi quản trị viên. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ hỗ trợ.",
                displayName
        );
        String link = "/account"; // hoặc trang profile / support của bạn
        notificationService.createNotification(
                u,
                NotificationType.USER_LOCKED_BY_ADMIN,
                msg,
                link
        );
    }

    @Override
    @Transactional
    public void unlockUser(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setIsActive(true);
        userRepo.save(u);
        String displayName = buildUserDisplayName(u);
        String msg = String.format(
                "Tài khoản của bạn (%s) đã được mở khóa. Bạn có thể đăng nhập và tiếp tục sử dụng hệ thống.",
                displayName
        );
        String link = "/account";
        notificationService.createNotification(
                u,
                NotificationType.USER_UNLOCKED_BY_ADMIN,
                msg,
                link
        );
    }

    @Override
    @Transactional
    public void rejectDelete(Long id) {
        UserEntity u = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        u.setDeleteRequested(false);
        userRepo.save(u);
        String displayName = buildUserDisplayName(u);
        String msg = String.format(
                "Yêu cầu xoá tài khoản của bạn (%s) đã bị từ chối. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.",
                displayName
        );
        String link = "/account";
        notificationService.createNotification(
                u,
                NotificationType.USER_DELETE_REQUEST_REJECTED,
                msg,
                link
        );
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
        String displayName = buildUserDisplayName(u);
        String msg = String.format(
                "Yêu cầu khóa tài khoản của bạn (%s) đã bị từ chối. Tài khoản vẫn đang hoạt động bình thường.",
                displayName
        );
        String link = "/account";
        notificationService.createNotification(
                u,
                NotificationType.USER_LOCK_REQUEST_REJECTED,
                msg,
                link
        );
    }

    // Utils
    private String buildUserDisplayName(UserEntity u) {
        String fullName = ((u.getLastName() == null ? "" : u.getLastName()) + " " +
                (u.getFirstName() == null ? "" : u.getFirstName())).trim();
        if (fullName.isBlank()) {
            fullName = (u.getEmail() != null && !u.getEmail().isBlank())
                    ? u.getEmail()
                    : ("User#" + u.getUserId());
        }
        return fullName;
    }

    private UserEntity getUserOrThrow(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }


}
