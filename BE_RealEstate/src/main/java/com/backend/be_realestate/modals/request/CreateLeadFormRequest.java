package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CreateLeadFormRequest {
    @NotEmpty
    private String name;

    @NotEmpty
    private String phone;

    @Email
    private String email;

    private String message;
}