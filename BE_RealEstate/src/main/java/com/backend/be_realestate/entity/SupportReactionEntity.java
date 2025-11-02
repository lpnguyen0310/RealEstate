package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "support_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id","user_id","emoji"}),
        indexes = @Index(name = "idx_sr_msg", columnList = "message_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportReactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // cascade không cần vì chỉ là quan hệ phụ
    @JoinColumn(name = "message_id", nullable = false)
    private SupportMessageEntity message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "emoji", length = 16, nullable = false)
    private String emoji;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}