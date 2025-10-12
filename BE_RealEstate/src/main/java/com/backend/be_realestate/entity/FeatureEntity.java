package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "features")
@Getter
@Setter
public class FeatureEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feature_key", unique = true, nullable = false)
    private String key;

    @Column(nullable = false)
    private String label;

    private String description;
}