package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "support_messages",
        indexes = @Index(name = "idx_sm_conv_time", columnList = "conversation_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SupportConversationEntity conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "sender_id", nullable = true)
    private UserEntity sender;

    @Column(name = "sender_role", length = 16, nullable = false)
    private String senderRole; // ADMIN hoặc CUSTOMER

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SupportAttachmentEntity> attachments = new ArrayList<>();
    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "client_message_id", length = 64)
    private String clientMessageId;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SupportReactionEntity> reactions = new ArrayList<>();
}