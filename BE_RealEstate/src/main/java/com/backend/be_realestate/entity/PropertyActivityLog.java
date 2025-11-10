package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ActivityType; // Bạn cần tạo Enum này
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "property_activity_logs", indexes = {
        @Index(name = "idx_activity_property_type_time", columnList = "property_id, activity_type, created_at"),
        @Index(name = "idx_activity_user", columnList = "user_id"),
        @Index(name = "idx_activity_ip", columnList = "ip_address")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_activity_log_property"))
    private PropertyEntity property;

    // Sẽ là null nếu người dùng là khách (guest)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",
            foreignKey = @ForeignKey(name = "fk_activity_log_user"))
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 16)
    private ActivityType activityType; // Enum: VIEW, SHARE, ZALO_CLICK

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    // Dùng để lọc trùng lặp cho khách
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent; // Optional: Dùng để phân tích/chống bot
}