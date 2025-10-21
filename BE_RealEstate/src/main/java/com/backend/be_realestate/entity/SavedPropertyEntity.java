package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "saved_properties",
        uniqueConstraints = @UniqueConstraint(name = "uk_saved_user_property", columnNames = {"user_id","property_id"}),
        indexes = {
                @Index(name = "idx_saved_user_created", columnList = "user_id, created_at DESC"),
                @Index(name = "idx_saved_user_property", columnList = "user_id, property_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedPropertyEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ai lưu
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_saved_user"))
    private UserEntity user;

    // BĐS được lưu
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false, foreignKey = @ForeignKey(name = "fk_saved_property"))
    private PropertyEntity property;

}
