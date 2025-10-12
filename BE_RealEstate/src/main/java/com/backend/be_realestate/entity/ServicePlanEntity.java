package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.Set;

@Entity
@Table(name = "service_plans")
@Getter
@Setter
public class ServicePlanEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_key", unique = true, nullable = false)
    private String key;

    @Column(nullable = false)
    private String title;

    @Column(name = "price_per_unit", nullable = false)
    private BigDecimal pricePerUnit;

    private String description;

    @Column(name = "is_recommended", columnDefinition = "boolean default false")
    private boolean isRecommended;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "plan_features",
            joinColumns = @JoinColumn(name = "plan_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id")
    )
    private Set<FeatureEntity> features;
}