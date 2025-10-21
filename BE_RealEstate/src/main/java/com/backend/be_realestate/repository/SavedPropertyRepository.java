package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SavedPropertyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedPropertyRepository extends JpaRepository<SavedPropertyEntity,Long> {
    boolean existsByUserUserIdAndPropertyId(Long userId, Long propertyId);
    void deleteByUserUserIdAndPropertyId(Long userId, Long propertyId);

    @Query("select sp.property.id from SavedPropertyEntity sp where sp.user.userId = :uid order by sp.createdAt desc")
    List<Long> findPropertyIdsByUser(@Param("uid") Long userId);
}
