package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "property_audit")
public class PropertyAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với PropertyEntity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private PropertyEntity property;

    // Ai thực hiện hành động (admin/user)
    @Column(name = "actor_id")
    private Long actorId;

    // Kiểu hành động: APPROVED / REJECTED / HIDDEN / UNHIDDEN / CREATED / UPDATED ...
    @Column(name = "type", length = 50)
    private String type;

    // Ghi chú chi tiết (VD: “Duyệt tin VIP 30 ngày”)
    @Column(name = "message", length = 500)
    private String message;

    // Thời gian thực hiện
    @Column(name = "at")
    private Timestamp at;
}
