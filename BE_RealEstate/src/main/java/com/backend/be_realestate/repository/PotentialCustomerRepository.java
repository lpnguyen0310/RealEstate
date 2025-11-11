package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.PotentialCustomer;
import com.backend.be_realestate.enums.CustomerLeadType;
import com.backend.be_realestate.enums.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;

@Repository
public interface PotentialCustomerRepository extends JpaRepository<PotentialCustomer, Long>, JpaSpecificationExecutor<PotentialCustomer> {

    // Kiểm tra trùng lặp "Xem SĐT" cho người dùng đã đăng nhập
    boolean existsByPropertyIdAndLeadUserUserIdAndLeadTypeAndCreatedAtAfter(
            Long propertyId, Long userId, CustomerLeadType leadType, Timestamp afterTime
    );

    // Kiểm tra trùng lặp "Xem SĐT" cho khách
    boolean existsByPropertyIdAndIpAddressAndLeadTypeAndCreatedAtAfter(
            Long propertyId, String ipAddress, CustomerLeadType leadType, Timestamp afterTime
    );
    Long countByPropertyId(Long propertyId);
    @Query("SELECT pc FROM PotentialCustomer pc " +
            "JOIN FETCH pc.property p " +
            "LEFT JOIN FETCH pc.leadUser lu " +
            "WHERE pc.propertyOwner.userId = :ownerId " +
            "AND p.propertyType = :propertyType")
    Page<PotentialCustomer> findMyLeads(
            @Param("ownerId") Long ownerId,
            @Param("propertyType") PropertyType propertyType,
            Pageable pageable
    );
}