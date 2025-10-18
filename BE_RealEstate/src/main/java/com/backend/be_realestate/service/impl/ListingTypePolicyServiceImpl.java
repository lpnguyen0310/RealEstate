package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.ListingTypePolicyConverter;
import com.backend.be_realestate.entity.ListingTypePolicy;
import com.backend.be_realestate.modals.dto.ListingTypePolicyDTO;
import com.backend.be_realestate.repository.ListingTypePolicyRepository;
import com.backend.be_realestate.service.IListingTypePolicyService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingTypePolicyServiceImpl implements IListingTypePolicyService {

    private final ListingTypePolicyRepository repo;
    private final ListingTypePolicyConverter mapper;
    @Override
    public List<ListingTypePolicyDTO> getAllListingTypePolicies() {
        List<ListingTypePolicy> entities = repo.findAll();
        return entities.stream()
                .map(mapper::convertToDto)
                .toList();
    }
}
