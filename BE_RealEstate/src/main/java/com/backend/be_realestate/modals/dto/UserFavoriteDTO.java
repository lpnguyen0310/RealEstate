package com.backend.be_realestate.modals.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserFavoriteDTO { // ⭐️ Đã đổi tên class
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    // (Bạn có thể thêm avatarUrl nếu có)
}
