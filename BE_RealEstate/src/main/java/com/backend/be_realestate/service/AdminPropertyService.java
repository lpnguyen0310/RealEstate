package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.property.ApprovePropertyRequest;
import com.backend.be_realestate.modals.property.RejectPropertyRequest;
import com.backend.be_realestate.modals.response.PropertyShortResponse;
import org.springframework.data.domain.Page;

public interface AdminPropertyService {
    PropertyShortResponse approve(Long propertyId, ApprovePropertyRequest req, Long adminId);
    PropertyShortResponse reject(Long propertyId, RejectPropertyRequest req, Long adminId);
    PropertyShortResponse hide(Long propertyId, Long adminId);
    PropertyShortResponse unhide(Long propertyId, Long adminId);
    void hardDelete(Long propertyId);
    Page<PropertyDTO> search(int page, int size, String q, Long categoryId, String listingType, String status);

}