package com.backend.be_realestate.modals.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentProfileDTO {
    private Long id;
    private String name;
    private String joinText;      // "Đồng hành cùng chúng tôi từ 03/2024"
    private Long sellingCount;    // Đang bán
    private Long rentingCount;    // Đang cho thuê
    private Long totalPosts;      // Số tin đã đăng
    private String phoneDisplay;  // Số điện thoại hiển thị ở nút
    private String zaloText;      // Label nút Zalo
}
