package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.Report;
import com.backend.be_realestate.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    // (Sau này dùng cho Admin)
     List<Report> findByStatus(ReportStatus status);
     List<Report> findByPropertyId(Long propertyId);
    List<Report> findByProperty_IdOrderByCreatedAtDesc(Long postId);
}
