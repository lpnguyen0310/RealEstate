package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.NotificationType;
import jakarta.persistence.*; // Hoặc javax.persistence.* nếu bạn dùng Spring Boot 2
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class NotificationEntity { // Bạn có thể cho extends BaseEntity nếu muốn

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người dùng sẽ *nhận* thông báo này
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user; // Liên kết tới UserEntity của bạn

//    @Column(nullable = true)
//    private String title; // <<< THÊM DÒNG NÀY

    @Column(nullable = false)
    private String message; // Nội dung thông báo

    private String link; // Đường dẫn khi click vào (ví dụ: /quan-ly-tin/123)

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false; // Mặc định là false

    // Dùng Enum để code sạch hơn
    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 50)
    private NotificationType type;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}