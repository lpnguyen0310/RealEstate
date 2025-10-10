package com.backend.be_realestate.modals.dto;

import lombok.Data;

@Data
public class AuthProviderDTO {
    private String provider;    // "GOOGLE", "LOCAL", ...
    private String providerUID;
}
