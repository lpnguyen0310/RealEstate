package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.response.AdminUserResponse;
import org.springframework.data.domain.Page;

public interface IAdminUserService {
    Page<AdminUserResponse> search(String q, String role, String status, String requestType, int page, int size);

    void lockUser(Long id);

    void unlockUser(Long id);

    void rejectDelete(Long id);

    void deleteHard(Long id);

    void rejectLock(Long id);

    void resetPasswordByAdmin(Long id);
}
