package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.WardEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WardRepository extends JpaRepository<WardEntity,Long> {
}
