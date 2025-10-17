package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.PackageItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PackageItemRepository extends JpaRepository<PackageItem, Long> { }

