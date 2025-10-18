package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.AmenityDTO;

import java.util.List;

public interface IAmenityService {
    List<AmenityDTO> getAllAmenities();

}
