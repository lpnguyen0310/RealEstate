package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.AmenityEntity;
import com.backend.be_realestate.entity.CategoryEntity;
import com.backend.be_realestate.modals.dto.AmenityDTO;
import com.backend.be_realestate.modals.dto.CategoryDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CategoryConverter {
    @Autowired
    private ModelMapper modelMapper;

    public CategoryDTO convertToDto(CategoryEntity entity) {
        return modelMapper.map(entity, CategoryDTO.class);
    }
}
