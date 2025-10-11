package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyMapper;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.service.IPropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PropertyServiceImpl implements IPropertyService { // implements interface

    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;

    @Autowired
    public PropertyServiceImpl(PropertyRepository propertyRepository, PropertyMapper propertyMapper) {
        this.propertyRepository = propertyRepository;
        this.propertyMapper = propertyMapper;
    }

    @Override // Thêm annotation @Override
    public List<PropertyCardDTO> getAllPropertiesForCardView() {
        var entities = propertyRepository.findAll();
        return entities.stream()
                .map(propertyMapper::toPropertyCardDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PropertyDetailDTO getPropertyDetailById(Long id) {
        // Gọi phương thức đã được tối ưu và sử dụng Exception tùy chỉnh
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));

        // Sử dụng mapper để chuyển đổi
        return propertyMapper.toPropertyDetailDTO(entity);
    }

}