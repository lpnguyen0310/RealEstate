package com.backend.be_realestate.modals.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private Boolean isActive;
    private String avatar;
    private List<String> roles;
    private AuthProviderDTO authProvider;
    private boolean lockRequested;
    private boolean deleteRequested;
}
