package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropertyRepository extends JpaRepository<PropertyEntity,Long> {
}
