package com.backend.be_realestate.modals.dto;

import lombok.Data;

@Data
public class UserSimpleDTO {
    private Long userId;
    private String email;
    private String phone;
    private String avatar;

    // Tên đầy đủ được gộp lại
    private String fullName;
}
