package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    // Lấy tất cả thông báo của 1 user, sắp xếp mới nhất lên đầu
    List<NotificationEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    // Đếm số thông báo CHƯA ĐỌC của 1 user
    long countByUserAndIsReadFalse(UserEntity user);

    // Lấy tất cả thông báo CHƯA ĐỌC của 1 user (dùng để "đánh dấu tất cả là đã đọc")
    List<NotificationEntity> findByUserAndIsReadFalse(UserEntity user);
}
