package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.ListingTypePolicy;
import com.backend.be_realestate.enums.ListingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ListingTypePolicyRepository extends JpaRepository<ListingTypePolicy,Long> {
    Optional<ListingTypePolicy> findFirstByListingTypeAndIsActive(ListingType listingType, Long isActive);

}
