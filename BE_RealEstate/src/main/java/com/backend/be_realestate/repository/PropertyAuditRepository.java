package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.PropertyAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyAuditRepository extends JpaRepository<PropertyAuditEntity, Long> {
    List<PropertyAuditEntity> findAllByProperty_IdOrderByAtDesc(Long propertyId);
    void deleteByPropertyId(Long propertyId);

}