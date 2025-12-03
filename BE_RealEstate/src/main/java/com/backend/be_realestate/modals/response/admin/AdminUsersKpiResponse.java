package com.backend.be_realestate.modals.response.admin;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminUsersKpiResponse {
    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private long pendingRequests; // lockRequested OR deleteRequested
}