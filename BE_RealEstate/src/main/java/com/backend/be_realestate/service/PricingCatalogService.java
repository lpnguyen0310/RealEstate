package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.packageEstate.ListingPackageDTO;

import java.util.List;

public interface PricingCatalogService {
    List<ListingPackageDTO> getActiveCatalog();
    ListingPackageDTO getByCode(String code);
    ListingPackageDTO upsertPackage(ListingPackageDTO dto); // create or update (by id/code)
    void deleteById(Long id);
    ListingPackageDTO toggleActive(Long id, boolean active);

}
