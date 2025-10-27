package com.backend.be_realestate.service.savedPost;

import com.backend.be_realestate.modals.dto.PropertyDTO;

import java.util.List;

public interface SavedPropertyService {
    boolean toggle(Long userId, Long propertyId);

    boolean isSaved(Long userId, Long propertyId);

    List<Long> listIds(Long userId);
    List<PropertyDTO> listDetails(Long userId, List<Long> propertyIds);

}
