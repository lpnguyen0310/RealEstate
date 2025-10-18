package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.AmenityEntity;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.PropertyImageEntity;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
@Component
@RequiredArgsConstructor
public class PropertyConverter {
    private final ModelMapper modelMapper;

    public PropertyDTO toDto(PropertyEntity entity) {
        PropertyDTO dto = modelMapper.map(entity, PropertyDTO.class);

        // set FK ids
        if (entity.getUser() != null)     dto.setUserId(entity.getUser().getUserId());
        if (entity.getCategory() != null) dto.setCategoryId(entity.getCategory().getId());
        if (entity.getWard() != null)     dto.setWardId(entity.getWard().getId());
        if (entity.getDistrict() != null) dto.setDistrictId(entity.getDistrict().getId());
        if (entity.getCity() != null)     dto.setCityId(entity.getCity().getId());
        if (entity.getImages() != null) {
            List<String> urls = entity.getImages().stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingInt(i ->
                            i.getDisplayOrder() == null ? 0 : i.getDisplayOrder()))
                    .map(PropertyImageEntity::getImageUrl)
                    .collect(Collectors.toList());
            dto.setImageUrls(urls);
        }
        if (entity.getAmenities() != null) {
            List<Long> amenityIds = entity.getAmenities().stream()
                    .filter(Objects::nonNull)
                    .map(AmenityEntity::getId)
                    .collect(Collectors.toList());
            dto.setAmenityIds(amenityIds);
        }
        // map postedAt and expiresAt
        return dto;
    }

    public PropertyEntity toEntity(PropertyDTO dto) {
        return modelMapper.map(dto, PropertyEntity.class);
    }

}
