package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.PropertyAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyAuditRepository extends JpaRepository<PropertyAuditEntity, Long> {
    List<PropertyAuditEntity> findAllByProperty_IdOrderByAtDesc(Long propertyId);
    void deleteByPropertyId(Long propertyId);
    // Lấy tất cả audit theo list propertyIds, order by at desc
    List<PropertyAuditEntity> findByProperty_IdInOrderByAtDesc(List<Long> propertyIds);

    // Lấy audit gần nhất theo type cho 1 property
    Optional<PropertyAuditEntity> findFirstByProperty_IdAndTypeOrderByAtDesc(Long propertyId, String type);
}