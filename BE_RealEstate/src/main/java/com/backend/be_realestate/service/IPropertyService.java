package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO; // Import DTO chi tiết
import com.backend.be_realestate.modals.dto.UserFavoriteDTO;
import com.backend.be_realestate.modals.dto.propertydashboard.PendingPropertyDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.PropertyKpiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface IPropertyService {
    List<PropertyCardDTO> getAllPropertiesForCardView();


    // NEW: method có userId + preview
    PropertyDetailDTO getPropertyDetailById(Long id, Long currentUserId, boolean preview);

    // Giữ API cũ để không phải sửa chỗ khác (default gọi sang hàm mới)
    default PropertyDetailDTO getPropertyDetailById(Long id) {
        return getPropertyDetailById(id, null, false);
    }

    Page<PropertyCardDTO> searchProperties(Map<String, String> params);

//    Page<PropertyDTO> getPropertiesByUser(Long userId, Pageable pageable);
    PropertyDTO create1(Long currentUserId, CreatePropertyRequest req, List<MultipartFile> images);
    CreatePropertyResponse create(Long userId, CreatePropertyRequest req);

    CreatePropertyResponse update(Long userId, Long propertyId, CreatePropertyRequest req);


    Page<PropertyDTO> getPropertiesByUser(Long userId,
                                          String status,
                                          Pageable pageable,
                                          Map<String, String> filters);

    Map<String, Long> getPropertyCountsByStatus(Long userId);

    List<UserFavoriteDTO> getUsersWhoFavorited(Long propertyId, Long currentUserId);

    List<PropertyCardDTO> getRecommendations(Long userId, int limit);

    PropertyKpiResponse propertiesKpi(String range, String status, String pendingStatus);
    PageResponse<PendingPropertyDTO> findPending(String q, int page, int size);

    PropertyDTO getDetailForEdit(Long propertyId, Long requesterUserId);

}