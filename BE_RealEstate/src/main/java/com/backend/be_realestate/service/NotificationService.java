package com.backend.be_realestate.service;

import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;

import java.util.List;

public interface NotificationService {


    void createNotification(UserEntity userId, NotificationType type, String message, String link);

    /**
     * Lấy danh sách thông báo của một người dùng.
     *
     * @param user Người dùng
     * @return Danh sách thông báo, sắp xếp mới nhất lên đầu
     */
    List<NotificationEntity> getNotificationsForUser(UserEntity user);

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng.
     *
     * @param user Người dùng
     * @return Số lượng thông báo chưa đọc
     */
    long getUnreadNotificationCount(UserEntity user);

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     *
     * @param notificationId ID của thông báo
     * @param user           Người dùng (để kiểm tra quyền sở hữu)
     * @return true nếu thành công, false nếu không tìm thấy hoặc không có quyền
     */
    boolean markAsRead(Long notificationId, UserEntity user);

    /**
     * Đánh dấu tất cả thông báo của người dùng là đã đọc.
     *
     * @param user Người dùng
     */
    void markAllAsRead(UserEntity user);
}