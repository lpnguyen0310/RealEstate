package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<PropertyEntity,Long> {
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
}
