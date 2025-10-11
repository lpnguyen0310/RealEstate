package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO; // Import DTO chi tiết

import java.util.List;

public interface IPropertyService {
    List<PropertyCardDTO> getAllPropertiesForCardView();

    PropertyDetailDTO getPropertyDetailById(Long id);

}