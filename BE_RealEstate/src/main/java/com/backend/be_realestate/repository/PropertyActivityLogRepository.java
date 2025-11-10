package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.PropertyActivityLog;
import com.backend.be_realestate.enums.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Collection;

@Repository
public interface PropertyActivityLogRepository extends JpaRepository<PropertyActivityLog, Long> {

    // Kiểm tra trùng lặp cho người dùng đã đăng nhập
    boolean existsByPropertyIdAndUserUserIdAndActivityTypeAndCreatedAtAfter(
            Long propertyId, Long userId, ActivityType activityType, Timestamp afterTime
    );

    // Kiểm tra trùng lặp cho khách (guest)
    boolean existsByPropertyIdAndIpAddressAndActivityTypeAndCreatedAtAfter(
            Long propertyId, String ipAddress, ActivityType activityType, Timestamp afterTime
    );

    Long countByPropertyIdAndActivityTypeIn(Long propertyId, Collection<ActivityType> types);
}