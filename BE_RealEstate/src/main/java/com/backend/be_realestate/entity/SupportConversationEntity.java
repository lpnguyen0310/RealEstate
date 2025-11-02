package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "support_conversations",
        indexes = {
                @Index(name = "idx_sc_status", columnList = "status"),
                @Index(name = "idx_sc_lastmsg", columnList = "last_message_at"),
                @Index(name = "idx_sc_assignee", columnList = "assignee_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportConversationEntity extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private UserEntity assignee; // Nhân viên phụ trách

    @Column(name = "status", length = 20, nullable = false)
    private String status = "UNASSIGNED";

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "last_message_preview", length = 255)
    private String lastMessagePreview;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "unread_for_assignee")
    private Integer unreadForAssignee = 0;

    @Column(name = "unread_for_customer")
    private Integer unreadForCustomer = 0;

    // Thông tin khách vãng lai (nếu chưa đăng nhập)
    @Column(name = "guest_name", length = 255)
    private String guestName;

    @Column(name = "guest_phone", length = 50)
    private String guestPhone;

    @Column(name = "guest_email", length = 255)
    private String guestEmail;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupportMessageEntity> messages = new ArrayList<>();

}
