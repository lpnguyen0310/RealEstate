package com.backend.be_realestate.utils;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.UserInventoryRepository;
import com.backend.be_realestate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PropertyStatusScheduler {

    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;
    // [NEW] Inject kho để trừ gói tin
    private final UserInventoryRepository inventoryRepo;

    // @Scheduled(cron = "0 0 2 * * *")
    @Scheduled(fixedRate = 600000) // Chạy mỗi 10 phút (khuyên dùng thay vì 10s để đỡ nặng DB)
    @Transactional // [IMPORTANT] Cần transactional để đảm bảo trừ kho và update tin đồng bộ
    public void updateStatuses() {
        LocalDateTime now = LocalDateTime.now();
        Timestamp nowTs = Timestamp.valueOf(now);

        // ==================================================================
        // 1. AUTO RENEW LOGIC (Chạy trước khi quét expired)
        // ==================================================================
        // Gọi hàm repository bạn đã thêm ở bước trước
        List<PropertyEntity> renewalCandidates = propertyRepository.findExpiredCandidatesForAutoRenew(nowTs);

        if (!renewalCandidates.isEmpty()) {
            log.info("Tìm thấy {} tin đăng cần gia hạn tự động...", renewalCandidates.size());
            for (PropertyEntity p : renewalCandidates) {
                try {
                    processAutoRenewal(p);
                } catch (Exception e) {
                    log.error("Lỗi auto-renew tin ID {}: {}", p.getId(), e.getMessage());
                }
            }
        }

        // ==================================================================
        // 2. EXISTING LOGIC (Expiring Soon Notification)
        // ==================================================================
        LocalDateTime soon = now.plusDays(8);
        Timestamp soonTs = Timestamp.valueOf(soon);

        var willExpireSoon = propertyRepository.findWillExpireSoon(nowTs, soonTs);
        willExpireSoon.forEach(p -> {
            try {
                String title = p.getTitle();
                if (title == null || title.isBlank()) title = "không có tiêu đề";
                else if (title.length() > 50) title = title.substring(0, 47) + "...";

                String message = String.format("Tin đăng '%s' sắp hết hạn, hãy gia hạn để tiếp tục hiển thị.", title);
                String link = String.format("/dashboard/posts?tab=expiring&viewPostId=%d", p.getId());

                notificationService.createNotification(p.getUser(), NotificationType.LISTING_EXPIRING_SOON, message, link);
            } catch (Exception e) {
                log.error("Lỗi noti EXPIRING_SOON property {}: {}", p.getId(), e.getMessage());
            }
        });

        // ==================================================================
        // 3. UPDATE STATUS (ExpiringSoon & Expired)
        // ==================================================================
        // Lưu ý: Những tin đã gia hạn ở bước 1 có expiresAt mới > nowTs nên sẽ KHÔNG bị quét thành expired ở đây.
        int expiring = propertyRepository.updateStatusForExpiringSoon(nowTs, soonTs);
        int expired  = propertyRepository.updateStatusForExpiredPosts(nowTs);

        log.info("Scheduler Report: AutoRenewed={} | MarkExpiringSoon={} | MarkExpired={}", renewalCandidates.size(), expiring, expired);
    }

    // [NEW] Helper Method xử lý gia hạn
    private void processAutoRenewal(PropertyEntity p) {
        Long userId = p.getUser().getUserId();
        String typeName = p.getListingType().name();

        // 1. Kiểm tra kho
        UserInventoryEntity inv = inventoryRepo.findByUser_UserIdAndItemType(userId, typeName).orElse(null);

        if (inv != null && inv.getQuantity() != null && inv.getQuantity() > 0) {
            // A. THÀNH CÔNG: Trừ kho & Gia hạn
            inv.setQuantity(inv.getQuantity() - 1);
            inventoryRepo.save(inv);

            // Lấy duration từ policy (nếu null mặc định 10 ngày)
            int duration = (p.getListingTypePolicy() != null && p.getListingTypePolicy().getDurationDays() != null)
                    ? p.getListingTypePolicy().getDurationDays() : 10;

            p.setExpiresAt(Timestamp.valueOf(LocalDateTime.now().plusDays(duration)));
            p.setStatus(PropertyStatus.PUBLISHED); // Reset về Active
            propertyRepository.save(p);

            notificationService.createNotification(p.getUser(), NotificationType.LISTING_AUTO_RENEWED,
                    String.format("Tin '%s' đã tự động gia hạn. Gói %s còn lại: %d",
                            p.getTitle(), typeName, inv.getQuantity()), "/dashboard/posts?id=" + p.getId());
        } else {
            // B. THẤT BẠI: Hết gói -> Tắt Auto Renew
            p.setAutoRenew(false);
            propertyRepository.save(p); // Không đổi expiresAt, để logic số 3 quét thành Expired

            notificationService.createNotification(p.getUser(), NotificationType.LISTING_RENEW_FAILED,
                    String.format("Gia hạn thất bại tin '%s' do hết gói tin %s.", p.getTitle(), typeName),
                    "/dashboard/buy-package");
        }
    }
}