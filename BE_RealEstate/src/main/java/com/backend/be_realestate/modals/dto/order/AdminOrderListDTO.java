package com.backend.be_realestate.modals.dto.order;

import com.backend.be_realestate.modals.dto.UserSimpleDTO;
import lombok.Data;

@Data
public class AdminOrderListDTO {
    private Long orderId;

    // Thông tin Khách hàng (Nhúng)
    private Long userId;
    private UserSimpleDTO user;

    // Chi tiết Đơn hàng
    private String status;
    private String method;
    private Long total;

    // Thông tin Meta (Cho cột Mã đơn)
    private Integer itemsCount; // Số lượng items trong đơn hàng
    private OrderItemDTO primaryItem; // <-- ĐÃ SỬA: Dùng OrderItemDTO

    // Thời gian
    private String createdAt;
    private String updatedAt;
}
