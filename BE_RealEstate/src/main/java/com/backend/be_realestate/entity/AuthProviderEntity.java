package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.AuthProviderType;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(
        name = "auth_providers",
        indexes = {
                @Index(name = "idx_auth_provider_user", columnList = "user_id"),
                @Index(name = "idx_auth_provider_uid", columnList = "provider_uid", unique = true)
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthProviderEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "provider_id")
    private Long providerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_auth_provider_user")
    )
    private UserEntity user;

    @Column(name = "provider", length = 50, nullable = false)
    private String provider; // "LOCAL", "GOOGLE", "FACEBOOK", ...

    @Column(name = "provider_uid", length = 255, nullable = false, unique = true)
    private String providerUID;

}