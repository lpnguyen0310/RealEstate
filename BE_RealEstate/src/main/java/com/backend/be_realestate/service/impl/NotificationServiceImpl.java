package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.NotificationConverter;
import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.modals.dto.NotificationDTO;
import com.backend.be_realestate.repository.NotificationRepository;
import com.backend.be_realestate.service.NotificationService;
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
    private final NotificationConverter notificationConverter;

    @Override
    public void createNotification(UserEntity user, NotificationType type, String message, String link) {
        // 1) Lưu DB
        NotificationEntity entity = new NotificationEntity();
        entity.setUser(user);
        entity.setType(type);
        entity.setMessage(message);
        entity.setLink(link);
        entity.setRead(false);
        NotificationEntity saved = notificationRepository.save(entity);

        // 2) Xác định principalName (phải KHỚP với Username ở CONNECT)
        String principalKey =
                user.getEmail() != null ? user.getEmail()
                        : user.getPhone() != null ? user.getPhone()
                        : String.valueOf(user.getUserId()); // fallback

        if (principalKey == null) {
            log.error("[Notify] Không thể gửi WS: user {} thiếu email/phone", user.getUserId());
            return;
        }

        // 3) Đổi sang DTO (có receiverId) và gửi đúng channel user
        try {
            NotificationDTO dto = notificationConverter.toDTO(saved);
            messagingTemplate.convertAndSendToUser(
                    principalKey,
                    "/queue/notifications",
                    dto
            );
            log.info("[Notify] WS -> userKey={} dtoId={}", principalKey, dto.getId());
        } catch (Exception e) {
            log.error("[Notify] Lỗi gửi WS (userId={}): {}", user.getUserId(), e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
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
        NotificationEntity n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null && n.getUser().getUserId().equals(user.getUserId())) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
            return true;
        }
        return false;
    }

    @Override
    public void markAllAsRead(UserEntity user) {
        List<NotificationEntity> list = notificationRepository.findByUserAndIsReadFalse(user);
        if (list.isEmpty()) return;
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}
