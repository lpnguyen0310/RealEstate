package com.backend.be_realestate.service;

import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.modals.dto.PotentialCustomerDTO;
import com.backend.be_realestate.modals.request.CreateLeadFormRequest; // Sẽ tạo DTO này
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IPropertyTrackingService {

    /**
     * Ghi nhận Lượt xem, có lọc trùng lặp.
     */
    void logView(Long propertyId, Long currentUserId, String ipAddress, String userAgent);

    /**
     * Ghi nhận Lượt tương tác (SHARE, ZALO_CLICK), có lọc trùng lặp.
     */
    void logInteraction(Long propertyId, ActivityType type, Long currentUserId, String ipAddress, String userAgent);

    /**
     * Tạo Khách hàng tiềm năng từ hành động "Xem số điện thoại".
     */
    void createLeadFromViewPhone(Long propertyId, Long currentUserId, String ipAddress);

    /**
     * Tạo Khách hàng tiềm năng từ "Form liên hệ".
     */
    void createLeadFromForm(Long propertyId, CreateLeadFormRequest formRequest, Long currentUserId, String ipAddress);
    Page<PotentialCustomerDTO> getMyLeads(Long propertyOwnerUserId, String propertyType, Pageable pageable);
    void deleteLead(Long leadId, Long ownerUserId);
}