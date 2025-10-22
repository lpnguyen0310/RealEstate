package com.backend.be_realestate.service.impl; // Giả sử bạn có package impl

import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.repository.NotificationRepository; // Import repository
import com.backend.be_realestate.service.NotificationService; // Import interface
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service // Đánh dấu đây là một Spring Bean
@RequiredArgsConstructor // Tự động inject các dependency (NotificationRepository)
@Transactional // Mặc định tất cả phương thức là transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    // Nếu bạn cần WebSocket, bạn cũng inject nó ở đây
    // private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void createNotification(UserEntity user, NotificationType type, String message, String link) {
        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setRead(false);

        NotificationEntity savedNotification = notificationRepository.save(notification);

        // TODO Nâng cao (WebSocket):
        // Gửi thông báo real-time tới client
        // Ví dụ: messagingTemplate.convertAndSendToUser(
        //     user.getUsername(), // Hoặc user.getId().toString()
        //     "/queue/notifications", // Kênh riêng của user
        //     convertToDTO(savedNotification) // Gửi DTO thay vì Entity
        // );
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