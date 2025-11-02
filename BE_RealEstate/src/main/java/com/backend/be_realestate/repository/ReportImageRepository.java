package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.ReportImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportImageRepository extends JpaRepository<ReportImage, Long> {
    // Thường không cần thêm gì ở đây
}
