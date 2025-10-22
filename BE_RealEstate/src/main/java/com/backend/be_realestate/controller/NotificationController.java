package com.backend.be_realestate.controller;

import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.NotificationDTO;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.UserService; // Giả sử bạn có service này
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // Dùng Spring Security
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép frontend gọi API
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository; // Dùng để lấy thông tin user đang đăng nhập

    /**
     * API: GET /api/notifications
     * Lấy danh sách thông báo của user đang đăng nhập.
     */
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(Authentication authentication) {
        UserEntity currentUser = getCurrentUser(authentication);
        List<NotificationEntity> notifications = notificationService.getNotificationsForUser(currentUser);

        // Chuyển từ List<Entity> sang List<DTO>
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * API: GET /api/notifications/unread-count
     * Lấy số lượng thông báo CHƯA ĐỌC.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadNotificationCount(Authentication authentication) {
        UserEntity currentUser = getCurrentUser(authentication);
        long count = notificationService.getUnreadNotificationCount(currentUser);
        return ResponseEntity.ok(count);
    }

    /**
     * API: POST /api/notifications/mark-read/{id}
     * Đánh dấu 1 thông báo cụ thể là ĐÃ ĐỌC.
     */
    @PostMapping("/mark-read/{id}")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Long id, Authentication authentication) {
        UserEntity currentUser = getCurrentUser(authentication);
        boolean success = notificationService.markAsRead(id, currentUser);

        if (success) {
            return ResponseEntity.ok().build(); // 200 OK
        } else {
            // 403: Không có quyền / 404: Không tìm thấy
            return ResponseEntity.status(403).body("Không tìm thấy thông báo hoặc không có quyền.");
        }
    }

    /**
     * API: POST /api/notifications/mark-all-read
     * Đánh dấu TẤT CẢ thông báo là ĐÃ ĐỌC.
     */
    @PostMapping("/mark-all-read")
    public ResponseEntity<?> markAllNotificationsAsRead(Authentication authentication) {
        UserEntity currentUser = getCurrentUser(authentication);
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build(); // 200 OK
    }

    // --- CÁC HÀM HỖ TRỢ ---

    /**
     * Lấy UserEntity từ thông tin
     * xác thực (Spring Security Principal).
     */
    private UserEntity getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new SecurityException("User chưa được xác thực");
        }

        String email = authentication.getName();

        // Sửa thành userRepository.findByEmail
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user với email: " + email));
    }

    /**
     * Chuyển đổi từ NotificationEntity sang NotificationDTO.
     */
    private NotificationDTO convertToDTO(NotificationEntity entity) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(entity.getId());
        dto.setMessage(entity.getMessage());
        dto.setLink(entity.getLink());
        dto.setRead(entity.isRead());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setType(entity.getType().name()); // Chuyển Enum thành String
        return dto;
    }
}