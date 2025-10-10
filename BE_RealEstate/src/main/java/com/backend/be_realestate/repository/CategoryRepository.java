package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CategoryEntity;
import com.backend.be_realestate.entity.CityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<CategoryEntity,Long> {
}
