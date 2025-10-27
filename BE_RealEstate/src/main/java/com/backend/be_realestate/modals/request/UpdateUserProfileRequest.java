package com.backend.be_realestate.modals.request;

import java.util.List;
import lombok.Data;

@Data
public class UpdateUserProfileRequest {
    // Thông tin UserEntity
    private String fullName;
    private String email;

    private String avatar;

    // Thông tin UserProfile
    private String personalTaxCode;
    private List<String> additionalPhones;

    // Thông tin Hoá đơn (Invoice)
    private String buyerName;
    private String invoiceEmail;
    private String companyName;
    private String companyTaxCode; // (Lưu ý: BE cũ là taxId)
    private String address;      // (Lưu ý: BE cũ là address)
    private String dvqhns;

    // Thông tin Định danh (Identity)
    private String citizenId;    // (Lưu ý: BE cũ là citizenId)
    private String passport;
}

