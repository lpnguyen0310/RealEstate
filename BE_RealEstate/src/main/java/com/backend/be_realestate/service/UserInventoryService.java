package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.UserInventoryDTO;

import java.util.List;

public interface UserInventoryService {
    List<UserInventoryDTO> getInventoryForUser(String email);
}
