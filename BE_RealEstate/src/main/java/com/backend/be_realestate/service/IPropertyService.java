package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO; // Import DTO chi tiết
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IPropertyService {
    List<PropertyCardDTO> getAllPropertiesForCardView();

    PropertyDetailDTO getPropertyDetailById(Long id);

    Page<PropertyDTO> getPropertiesByUser(Long userId, Pageable pageable);
    PropertyDTO create(Long currentUserId, CreatePropertyRequest req, List<MultipartFile> images);

}