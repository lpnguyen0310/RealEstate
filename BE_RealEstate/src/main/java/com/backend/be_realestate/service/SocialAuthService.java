package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.GoogleProfile;
import com.backend.be_realestate.modals.dto.UserDTO;

public interface SocialAuthService {
    UserDTO upsertGoogleUser(GoogleProfile profile);

}
