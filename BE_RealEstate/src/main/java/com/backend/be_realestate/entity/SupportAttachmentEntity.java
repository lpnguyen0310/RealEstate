package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "support_attachments",
        indexes = @Index(name = "idx_sa_msg", columnList = "message_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportAttachmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Long attachmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private SupportMessageEntity message;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;
}