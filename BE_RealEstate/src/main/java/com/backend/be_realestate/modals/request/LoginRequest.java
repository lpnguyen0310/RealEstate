package com.backend.be_realestate.modals.request;


import lombok.Data;

@Data
public class LoginRequest {
    private String identifier; // email hoặc phone
    private String password;
}