package com.backend.be_realestate.service.impl; // Giả sử bạn có package impl

import com.backend.be_realestate.converter.NotificationConverter;
import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.modals.dto.NotificationDTO;
import com.backend.be_realestate.repository.NotificationRepository; // Import repository
import com.backend.be_realestate.service.NotificationService; // Import interface
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final NotificationConverter notificationConverter; // ⭐️ INJECT CONVERTER

    @Override
    public void createNotification(UserEntity user, NotificationType type, String message, String link) {
        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setRead(false);
        // Giả sử @PrePersist tự động thêm createdAt

        NotificationEntity savedNotification = notificationRepository.save(notification);

        // ⭐️ SỬA ĐỔI QUAN TRỌNG: Chuyển đổi sang DTO trước khi gửi
        try {
            String destinationUser = user.getEmail();
            if (destinationUser == null) {
                // Nếu user đăng nhập bằng SĐT, dùng SĐT làm destination
                destinationUser = user.getPhone();
            }

            if (destinationUser == null) {
                log.error("Không thể gửi WS notification: User {} không có email hoặc SĐT.", user.getUserId());
                return;
            }

            // 1. Chuyển đổi Entity sang DTO
            NotificationDTO dto = notificationConverter.toDTO(savedNotification);

            String channel = "/queue/notifications";

            // 2. Gửi DTO (đã an toàn) thay vì Entity
            messagingTemplate.convertAndSendToUser(
                    destinationUser,
                    channel,
                    dto // ⭐️ GỬI DTO
            );
            log.info("Đã gửi thông báo WebSocket tới user: {}", destinationUser);

        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo WebSocket cho user {}: {}", user.getUserId(), e.getMessage(), e);
        }
    }


    @Override
    @Transactional(readOnly = true) // Tối ưu cho các tác vụ chỉ đọc
    public List<NotificationEntity> getNotificationsForUser(UserEntity user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(UserEntity user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Override
    public boolean markAsRead(Long notificationId, UserEntity user) {
        // Tìm thông báo
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElse(null);

        // Kiểm tra bảo mật: thông báo phải tồn tại VÀ thuộc về đúng người dùng
        if (notification != null && notification.getUser().getUserId().equals(user.getUserId())) {
            if (!notification.isRead()) { // Chỉ update nếu nó chưa được đọc
                notification.setRead(true);
                notificationRepository.save(notification);
            }
            return true;
        }
        return false;
    }

    @Override
    public void markAllAsRead(UserEntity user) {
        List<NotificationEntity> unreadNotifications = notificationRepository.findByUserAndIsReadFalse(user);

        if (unreadNotifications.isEmpty()) {
            return; // Không cần làm gì
        }

        unreadNotifications.forEach(notification -> notification.setRead(true));

        notificationRepository.saveAll(unreadNotifications);
    }
}