package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.ListingTypePolicyDTO;

import java.util.List;

public interface IListingTypePolicyService {
    List<ListingTypePolicyDTO> getAllListingTypePolicies();
}
