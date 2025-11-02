package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "reports")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder // <-- Thêm Builder để khởi tạo dễ dàng
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private UserEntity reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private PropertyEntity property;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_reasons", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "reason", nullable = false)
    @Builder.Default // <-- Thêm Builder.Default
    private Set<String> reasons = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default // <-- Thêm Builder.Default
    private ReportStatus status = ReportStatus.PENDING; // <-- Gán mặc định tại đây

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(
            mappedBy = "report",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default // <-- Thêm Builder.Default
    private List<ReportImage> images = new ArrayList<>();

    // (Xóa constructor thủ công)

    // Hàm helper để thêm ảnh (vẫn giữ lại vì đây là logic nghiệp vụ)
    // Giúp đồng bộ 2 chiều
    public void addImage(ReportImage image) {
        images.add(image);
        image.setReport(this);
    }
}