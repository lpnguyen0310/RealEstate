package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterComplete {
    @NotBlank
    private String ticket;      // UUID trả về sau bước verify

    @NotBlank @Size(min=6, max=100)
    private String password;

    private String phone;
    private String firstName;
    private String lastName;
}
