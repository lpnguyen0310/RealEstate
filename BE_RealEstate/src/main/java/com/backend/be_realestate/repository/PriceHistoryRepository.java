package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PriceHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriceHistoryRepository extends JpaRepository<PriceHistoryEntity,Long> {
}
