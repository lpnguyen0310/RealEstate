package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyImage extends JpaRepository<PropertyImageEntity,Long> {
    @Query("select i from PropertyImageEntity i where i.property.id in :ids order by coalesce(i.displayOrder, 0) asc")
    List<PropertyImageEntity> findAllByPropertyIdIn(@Param("ids") List<Long> ids);
}
