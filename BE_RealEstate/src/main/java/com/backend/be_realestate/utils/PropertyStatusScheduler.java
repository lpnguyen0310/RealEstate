package com.backend.be_realestate.utils;

import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PropertyStatusScheduler {

    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService; // dùng interface

    // @Scheduled(cron = "0 0 2 * * *")
    @Scheduled(fixedRate = 10_000)
    public void updateStatuses() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(8);   // ngưỡng "sắp hết hạn"

        Timestamp nowTs = Timestamp.valueOf(now);
        Timestamp soonTs = Timestamp.valueOf(soon);

        var willExpireSoon = propertyRepository.findWillExpireSoon(nowTs, soonTs);

        willExpireSoon.forEach(p -> {
            try {
                String title = p.getTitle();
                if (title == null || title.isBlank()) {
                    title = "không có tiêu đề";
                } else if (title.length() > 50) {
                    title = title.substring(0, 47) + "...";
                }

                String message = String.format(
                        "Tin đăng '%s' của bạn sắp hết hạn, hãy gia hạn để tiếp tục hiển thị.",
                        title
                );

                // link FE mở tab “Sắp hết hạn” và highlight bài
                String link = String.format(
                        "/dashboard/posts?tab=expiring&viewPostId=%d",
                        p.getId()
                );

                notificationService.createNotification(
                        p.getUser(),
                        NotificationType.LISTING_EXPIRING_SOON,
                        message,
                        link
                );
            } catch (Exception e) {
                log.error("Lỗi khi gửi noti EXPIRING_SOON cho property {}: {}",
                        p.getId(), e.getMessage(), e);
            }
        });

       int expiring = propertyRepository.updateStatusForExpiringSoon(nowTs, soonTs);
        int expired  = propertyRepository.updateStatusForExpiredPosts(nowTs);

        log.info("Update property status: expiringSoon={}, expired={}", expiring, expired);
    }




}