package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.AgentProfileDTO;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.request.ChangePasswordRequest;
import com.backend.be_realestate.modals.response.admin.NewUsersKpiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

public interface UserService {
    UserDTO getCurrentUser(Authentication auth);

    // --- User tự thao tác (self-service) ---
    void requestLock(Long userId, String currentPassword);

    void cancelLockRequest(Long userId);
    void requestDelete(Long userId);
    void cancelDeleteRequest(Long userId);                 // hủy yêu cầu xóa

    void changePassword(Long userId, ChangePasswordRequest req);

    NewUsersKpiResponse newUsersKpi(String range);

    AgentProfileDTO getAgentProfile(Long agentId);

    Page<PropertyCardDTO> getAgentListings(Long agentId,
                                           String type,      // "sell" | "rent" | null
                                           Pageable pageable);
}
