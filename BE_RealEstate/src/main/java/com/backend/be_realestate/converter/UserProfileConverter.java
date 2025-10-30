package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.entity.UserProfile;
import com.backend.be_realestate.modals.request.UpdateUserProfileRequest;
import com.backend.be_realestate.modals.response.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Đã cập nhật Converter để xử lý logic update cho CẢ HAI Entity
 */
@Component
@RequiredArgsConstructor
public class UserProfileConverter {

    /**
     * Chuyển đổi từ 2 Entity (User + Profile) sang 1 DTO Response
     */
    public UserProfileResponse toUserProfileResponse(UserEntity user, UserProfile profile) {
        if (user == null || profile == null) {
            return null;
        }

        // Tạo fullName từ firstName và lastName
        String fullName = (StringUtils.hasText(user.getLastName()) ? user.getLastName() : "")
                + " "
                + (StringUtils.hasText(user.getFirstName()) ? user.getFirstName() : "");
        fullName = fullName.trim();

        return UserProfileResponse.builder()
                // Từ UserEntity
                .userId(user.getUserId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(fullName) // fullName tính toán
                .avatar(user.getAvatar())
                .mainBalance(user.getMainBalance())
                .bonusBalance(user.getBonusBalance())

                // Từ UserProfile
                .personalTaxCode(profile.getPersonalTaxCode())
                .additionalPhones(profile.getAdditionalPhones())
                .buyerName(profile.getBuyerName())
                .invoiceEmail(profile.getInvoiceEmail())
                .companyName(profile.getCompanyName())
                .companyTaxCode(profile.getCompanyTaxCode())
                .address(profile.getAddress())
                .dvqhns(profile.getDvqhns())
                .citizenId(profile.getCitizenId())
                .passport(profile.getPassport())
                .build();
    }

    /**
     * Cập nhật thông tin từ DTO (Request) vào 2 Entity (User + Profile)
     * Đây là logic "PATCH" (chỉ cập nhật các trường non-null từ request)
     */
    public void updateProfileFromRequest(UpdateUserProfileRequest request, UserEntity user, UserProfile profile) {

        // --- Cập nhật UserEntity ---
        if (StringUtils.hasText(request.getEmail())) {
            user.setEmail(request.getEmail());
        }

        if (StringUtils.hasText(request.getAvatar())) {
            user.setAvatar(request.getAvatar()); // <-- Cập nhật Avatar URL
        }

        // Xử lý logic chia fullName
        if (StringUtils.hasText(request.getFullName())) {
            String fullName = request.getFullName().trim();
            int lastSpaceIndex = fullName.lastIndexOf(' ');

            if (lastSpaceIndex > 0) {
                // Có cả họ và tên
                user.setLastName(fullName.substring(0, lastSpaceIndex));
                user.setFirstName(fullName.substring(lastSpaceIndex + 1));
            } else if (lastSpaceIndex == 0) {
                // Trường hợp lạ " Tên"
                user.setLastName(null);
                user.setFirstName(fullName.substring(1));
            } else {
                // Chỉ có tên, không có họ (ví dụ: "Tên")
                user.setLastName(null);
                user.setFirstName(fullName);
            }
        }

        // --- Cập nhật UserProfile ---
        if (request.getPersonalTaxCode() != null) {
            profile.setPersonalTaxCode(request.getPersonalTaxCode());
        }
        if (request.getAdditionalPhones() != null) {
            profile.setAdditionalPhones(request.getAdditionalPhones());
        }
        if (request.getBuyerName() != null) {
            profile.setBuyerName(request.getBuyerName());
        }
        if (request.getInvoiceEmail() != null) {
            profile.setInvoiceEmail(request.getInvoiceEmail());
        }
        if (request.getCompanyName() != null) {
            profile.setCompanyName(request.getCompanyName());
        }
        if (request.getCompanyTaxCode() != null) {
            profile.setCompanyTaxCode(request.getCompanyTaxCode());
        }
        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress());
        }
        if (request.getDvqhns() != null) {
            profile.setDvqhns(request.getDvqhns());
        }
        if (request.getCitizenId() != null) {
            profile.setCitizenId(request.getCitizenId());
        }
        if (request.getPassport() != null) {
            profile.setPassport(request.getPassport());
        }
    }
}

