package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ImageType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyImageEntity {
    public enum ImageType { PUBLIC, CONSTRUCTION }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", length = 255, nullable = false)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;


    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", length = 20, nullable = false)
    private ImageType imageType = ImageType.PUBLIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private PropertyEntity property;
}