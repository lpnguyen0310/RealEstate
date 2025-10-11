package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.UserDTO;
import org.springframework.security.core.Authentication;

public interface UserService {
    UserDTO getCurrentUser(Authentication auth);
}
