package com.backend.be_realestate.modals.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO Response chứa thông tin gộp từ UserEntity và UserProfile
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    // Từ UserEntity
    private Long userId;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String fullName; // (Trường này được tính toán trong Converter)
    private String avatar;

    // Từ UserProfile
    private String personalTaxCode;
    private List<String> additionalPhones;
    private String buyerName;
    private String invoiceEmail;
    private String companyName;
    private String companyTaxCode;
    private String address;
    private String dvqhns;
    private String citizenId;
    private String passport;

    private Long mainBalance;
    private Long bonusBalance;
}

