package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.AmentyConverter;
import com.backend.be_realestate.entity.AmenityEntity;
import com.backend.be_realestate.modals.dto.AmenityDTO;
import com.backend.be_realestate.repository.AmenityRepository;
import com.backend.be_realestate.service.IAmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmenityServiceImpl implements IAmenityService {

    private final AmenityRepository repo;
    private final AmentyConverter mapper;

    @Override
    public List<AmenityDTO> getAllAmenities() {
        List<AmenityEntity> entities = repo.findAll();
        return entities.stream()
                .map(mapper::convertToDto)
                .toList();
    }
}