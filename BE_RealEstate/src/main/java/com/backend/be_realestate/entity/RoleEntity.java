package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name="roles",indexes=@Index(name="uk_roles_code", columnList="code", unique=true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="role_id")
    private Long roleId;

    @Column(name="code", length=50, nullable=false, unique=true)
    private String code;

    @Column(name="name", length=100, nullable=false)
    private String name;
    @ManyToMany(mappedBy="roles")
    private List<UserEntity> users;
}
