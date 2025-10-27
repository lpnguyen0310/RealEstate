package com.backend.be_realestate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Đã cập nhật Entity để khớp với DTO và Form (thêm 2 trường tax code)
 */
@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // Liên kết 'id' này với 'id' của UserEntity
    @JoinColumn(name = "user_id")
    private UserEntity user;

    // ----- Thông tin cá nhân/Thuế -----
    @Column(name = "personal_tax_code", length = 50)
    private String personalTaxCode; // Mã thuế cá nhân

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_additional_phones", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "phone_number", length = 20)
    private List<String> additionalPhones;

    // ----- Thông tin xuất hoá đơn (Invoice) -----
    @Column(name = "buyer_name", length = 200)
    private String buyerName; // Tên người mua hàng

    @Column(name = "invoice_email", length = 200)
    private String invoiceEmail; // Email nhận hoá đơn

    @Column(name = "company_name", length = 255)
    private String companyName; // Tên công ty

    @Column(name = "company_tax_code", length = 50)
    private String companyTaxCode; // Mã thuế công ty

    @Column(name = "address", length = 500)
    private String address; // Địa chỉ (Lưu code quốc gia "VN", "US"...)

    @Column(name = "dvqhns", length = 100)
    private String dvqhns; // Mã số ĐVQHNS

    // ----- Thông tin định danh (Identity) -----
    @Column(name = "citizen_id", length = 50)
    private String citizenId; // Căn cước công dân

    @Column(name = "passport", length = 50)
    private String passport; // Hộ chiếu

    // Constructors, Getters/Setters (Lombok)
}

