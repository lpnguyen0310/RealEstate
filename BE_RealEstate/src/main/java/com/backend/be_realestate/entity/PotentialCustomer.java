package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.CustomerLeadType; // Đã đổi tên
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "potential_customers", indexes = { // Đã đổi tên bảng
        @Index(name = "idx_customer_property", columnList = "property_id"),
        @Index(name = "idx_customer_owner", columnList = "property_owner_user_id"),
        @Index(name = "idx_customer_type", columnList = "lead_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PotentialCustomer { // Đã đổi tên class

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_customer_property")) // Đổi tên FK
    private PropertyEntity property;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_owner_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_customer_property_owner")) // Đổi tên FK
    private UserEntity propertyOwner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_user_id", // Tên cột có thể giữ (lead_user)
            foreignKey = @ForeignKey(name = "fk_customer_lead_user")) // Đổi tên FK
    private UserEntity leadUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_type", nullable = false, length = 16) // Tên cột có thể giữ (lead_type)
    private CustomerLeadType leadType; // Đã đổi tên Enum

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    // Các trường thông tin liên hệ
    @Column(name = "lead_name", length = 100)
    private String leadName;

    @Column(name = "lead_phone", length = 20)
    private String leadPhone;

    @Column(name = "lead_email", length = 100)
    private String leadEmail;

    @Column(name = "message", length = 1000)
    private String message;
}