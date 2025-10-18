package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.AmenityEntity;
import com.backend.be_realestate.entity.ListingTypePolicy;
import com.backend.be_realestate.modals.dto.AmenityDTO;
import com.backend.be_realestate.modals.dto.ListingTypePolicyDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ListingTypePolicyConverter {
    @Autowired
    private ModelMapper modelMapper;
    public ListingTypePolicyDTO convertToDto(ListingTypePolicy entity) {
        return modelMapper.map(entity, ListingTypePolicyDTO.class);
    }
}
