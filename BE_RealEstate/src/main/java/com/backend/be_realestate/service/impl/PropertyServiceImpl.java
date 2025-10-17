package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.PropertyConverter;
import com.backend.be_realestate.converter.PropertyMapper;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.exceptions.ResourceNotFoundException;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.IPropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements IPropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;
    private final PropertyConverter propertyConverter;
    private final PropertyImage propertyImageRepository;
    private final AmenityRepository amenityRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;
    private final UserRepository userRepository;

    @Override
    public List<PropertyCardDTO> getAllPropertiesForCardView() {
        return propertyRepository.findAll().stream()
                .map(propertyMapper::toPropertyCardDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PropertyDetailDTO getPropertyDetailById(Long id) {
        PropertyEntity entity = propertyRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
        return propertyMapper.toPropertyDetailDTO(entity);
    }

    @Override
    public Page<PropertyDTO> getPropertiesByUser(Long userId, Pageable pageable) {
        return propertyRepository.findAllByUser_UserId(userId, pageable)
                .map(propertyConverter::toDto);
    }


    @Override
    @Transactional
    public PropertyDTO create(Long currentUserId, CreatePropertyRequest req, List<MultipartFile> images) {
        // 1) Load quan hệ bắt buộc
        return null;
    }
}
