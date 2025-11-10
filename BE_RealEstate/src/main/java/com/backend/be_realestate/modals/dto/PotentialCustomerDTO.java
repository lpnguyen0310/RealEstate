package com.backend.be_realestate.modals.dto;

import com.backend.be_realestate.entity.PotentialCustomer;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.CustomerLeadType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
public class PotentialCustomerDTO {

    // Thông tin từ PotentialCustomer
    private Long id;
    private CustomerLeadType leadType;
    private Timestamp createdAt;
    private String message;
    private String ipAddress;

    // Thông tin người liên hệ (Lead) - Lấy từ 3 nguồn
    private Long leadUserId; // ID của user (nếu họ đăng nhập)
    private String leadName;
    private String leadPhone;
    private String leadEmail;
    private String leadAvatar;
    private boolean isRegisteredUser; // true nếu leadUserId != null

    // Thông tin tin đăng liên quan
    private Long propertyId;
    private String propertyTitle;

    /**
     * Hàm convert (đặt ở đây hoặc trong Mapper)
     * Dùng để biến Entity (đã join) thành DTO
     */
    public PotentialCustomerDTO(PotentialCustomer entity) {
        this.id = entity.getId();
        this.leadType = entity.getLeadType();
        this.createdAt = entity.getCreatedAt();
        this.message = entity.getMessage();
        this.ipAddress = entity.getIpAddress();

        // Join thông tin tin đăng
        PropertyEntity property = entity.getProperty();
        if (property != null) {
            this.propertyId = property.getId();
            this.propertyTitle = property.getTitle();
        }

        // Xử lý logic 2 loại lead
        UserEntity leadUser = entity.getLeadUser(); // Người dùng đã đăng nhập (nếu có)

        if (entity.getLeadType() == CustomerLeadType.CONTACT_FORM) {
            // Loại 1: Lead từ Form (có đầy đủ thông tin)
            this.leadName = entity.getLeadName();
            this.leadPhone = entity.getLeadPhone();
            this.leadEmail = entity.getLeadEmail();
            this.isRegisteredUser = (leadUser != null);
            if (leadUser != null) {
                this.leadAvatar = leadUser.getAvatar();
                this.leadUserId = leadUser.getUserId();
            }
        } else {
            // Loại 2: Lead từ View Phone / Zalo Click (ẩn danh hoặc đã đăng nhập)
            if (leadUser != null) {
                // Người xem đã đăng nhập
                this.leadName = (leadUser.getFirstName() + " " + leadUser.getLastName()).trim();
                this.leadPhone = leadUser.getPhone();
                this.leadEmail = leadUser.getEmail();
                this.leadAvatar = leadUser.getAvatar();
                this.leadUserId = leadUser.getUserId();
                this.isRegisteredUser = true;
            } else {
                // Người xem ẩn danh
                this.leadName = "Khách (vãng lai)";
                this.isRegisteredUser = false;
            }
        }
    }
}