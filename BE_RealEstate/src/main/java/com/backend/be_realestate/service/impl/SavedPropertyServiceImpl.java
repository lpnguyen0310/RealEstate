package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.SavedPropertyEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.SavedPropertyRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.savedPost.SavedPropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedPropertyServiceImpl implements SavedPropertyService {
    private final SavedPropertyRepository savedRepo;
    private final PropertyRepository propertyRepo;
    private final UserRepository userRepo;
    private final NotificationServiceImpl notificationService;

    @Override
    @Transactional
    public boolean toggle(Long userId, Long propertyId) {
        // Nếu đã lưu → xóa, chưa lưu → thêm mới
        if (savedRepo.existsByUserUserIdAndPropertyId(userId, propertyId)) {
            savedRepo.deleteByUserUserIdAndPropertyId(userId, propertyId);
            return false; // sau toggle là bỏ lưu
        }

        var user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var prop = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        savedRepo.save(SavedPropertyEntity.builder()
                .user(user)
                .property(prop)
                .build());

        try {
            UserEntity owner = prop.getUser(); // Lấy chủ sở hữu của tin đăng
            UserEntity liker = user;           // Lấy người vừa nhấn "yêu thích"

            // Chỉ gửi thông báo nếu người "thích" không phải là chủ tin
            if (owner != null && !owner.getUserId().equals(liker.getUserId())) {

                // ==========================================================
                // ++ SỬA ĐỔI BẮT ĐẦU TỪ ĐÂY ++
                // ==========================================================

                // Xây dựng tên của người "like" từ firstName và lastName
                String firstName = liker.getFirstName();
                String lastName = liker.getLastName();
                String likerName;

                if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
                    likerName = firstName + " " + lastName;
                } else if (firstName != null && !firstName.isBlank()) {
                    likerName = firstName;
                } else if (lastName != null && !lastName.isBlank()) {
                    likerName = lastName;
                } else {
                    likerName = "Một người dùng"; // Fallback nếu cả 2 đều rỗng
                }

                // ==========================================================
                // ++ KẾT THÚC SỬA ĐỔI ++
                // ==========================================================

                String propTitle = prop.getTitle() != null ? prop.getTitle() : "tin đăng";
                if (propTitle.length() > 30) { // Rút gọn tiêu đề
                    propTitle = propTitle.substring(0, 27) + "...";
                }

                String message = String.format("%s vừa yêu thích tin đăng \"%s\" của bạn.", likerName, propTitle);

                // Link tới bài viết
                String link = "/real-estate/" + prop.getId(); // (Sửa link cho đúng với frontend)

                notificationService.createNotification(
                        owner, // Gửi cho chủ tin
                        NotificationType.LISTING_FAVORITED,
                        message,
                        link
                );
            }

        } catch (Exception e) {
            // Rất quan trọng: Nếu gửi thông báo lỗi,
            // không được làm hỏng (rollback) giao dịch 'lưu tin'
            log.error("Lỗi khi gửi thông báo 'yêu thích' cho property {}: {}", prop.getId(), e.getMessage());
        }

        return true;
    }

    @Override
    public boolean isSaved(Long userId, Long propertyId) {
        return savedRepo.existsByUserUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public List<Long> listIds(Long userId) {
        return savedRepo.findPropertyIdsByUser(userId);
    }
}
