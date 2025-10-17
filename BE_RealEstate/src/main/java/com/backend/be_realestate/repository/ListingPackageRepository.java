package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.ListingPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingPackageRepository extends JpaRepository<ListingPackage, Long> {
    List<ListingPackage> findAllByIsActiveTrueOrderBySortOrderAscIdAsc();
    Optional<ListingPackage> findByCode(String code);
    boolean existsByCode(String code);
}
