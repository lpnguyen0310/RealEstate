package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CityRepository extends JpaRepository<CityEntity,Long> {
}
