package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<PropertyEntity,Long>, JpaSpecificationExecutor<PropertyEntity> {
    @Query("SELECT p FROM PropertyEntity p " +
            "LEFT JOIN FETCH p.images " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.ward " +
            "LEFT JOIN FETCH p.district " +
            "LEFT JOIN FETCH p.city " +
            "WHERE p.id = :id")
    Optional<PropertyEntity> findByIdWithDetails(@Param("id") Long id);

    Page<PropertyEntity> findAllByUser_UserId(Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PropertyEntity p where p.id = :id")
    Optional<PropertyEntity> lockById(@Param("id") Long id);

    // UserInventoryRepository.java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from UserInventoryEntity i where i.user.userId = :userId and i.itemType = :type")
    Optional<UserInventoryEntity> lockByUserAndType(@Param("userId") Long userId, @Param("type") String type);


    @Modifying
    @Query("UPDATE PropertyEntity p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int bumpView(@Param("id") Long id);
}


