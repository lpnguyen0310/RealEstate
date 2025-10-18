package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.ListingTypePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListingTypePolicyRepository extends JpaRepository<ListingTypePolicy,Long> {
}
