package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "report_images")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReportImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String imageUrl; // URL từ Cloudinary

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;
}