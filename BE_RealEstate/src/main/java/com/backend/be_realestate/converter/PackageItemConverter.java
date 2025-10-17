package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.PackageItem;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.modals.dto.packageEstate.PackageItemDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PackageItemConverter {

    private final ModelMapper modelMapper;

    public PackageItemDTO toDto(PackageItem entity) {
        PackageItemDTO dto = modelMapper.map(entity, PackageItemDTO.class);
        // enum -> String
        dto.setListingType(entity.getListingType() != null ? entity.getListingType().name() : null);
        return dto;
    }

    public PackageItem toEntity(PackageItemDTO dto) {
        PackageItem entity = modelMapper.map(dto, PackageItem.class);
        // String -> enum
        if (dto.getListingType() != null) {
            entity.setListingType(ListingType.valueOf(dto.getListingType()));
        }
        return entity;
    }
}
