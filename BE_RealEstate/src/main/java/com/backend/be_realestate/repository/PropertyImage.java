package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropertyImage extends JpaRepository<PropertyImageEntity,Long> {
}
