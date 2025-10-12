package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "amenities",
        indexes = @Index(name="idx_amenities_name", columnList="name", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmenityEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(length = 60) // optional: icon key
    private String icon;
}
