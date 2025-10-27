package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Set;

@Entity
@Table(name="users",
        indexes = {
                @Index(name="idx_users_email", columnList="email", unique=true),
                @Index(name="idx_users_phone", columnList="phone", unique=true),
                @Index(name = "idx_users_created_at", columnList = "created_at")

        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="user_id")
    private Long userId;

    @Column(name="is_active", nullable=false)
    private Boolean isActive = true;

    @Column(name="email", length=200, nullable=false, unique=true)
    private String email;

    @Column(name="phone", length=20, unique=true)
    private String phone;

    @Column(name="password_hash", length=255, nullable=false)
    private String passwordHash;

    @Column(name="avatar", length=500)
    private String avatar;

    @Column(name="first_name", length=100)
    private String firstName;

    @Column(name="last_name", length=100)
    private String lastName;

    @Column(name="zalo_url", length = 100)
    private String zalo_url;

    @ManyToMany
    @JoinTable(
            name="user_roles",
            joinColumns=@JoinColumn(name="user_id"),
            inverseJoinColumns=@JoinColumn(name="role_id"),
            indexes = {
                    @Index(name="uk_user_roles_user_id_role_id", columnList="user_id, role_id", unique=true)
            }
    )
    private List<RoleEntity> roles;

    @Column(name="delete_requested", nullable=false)
    private Boolean deleteRequested = false;

    @Column(name = "lock_requested", nullable = false)
    private Boolean lockRequested = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AuthProviderEntity authProvider;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderEntity> orders;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserProfile userProfile;

}
