package com.backend.be_realestate.modals.response;

import com.backend.be_realestate.modals.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterCompleteResponse {
    private String message;
    private UserDTO user;
}