package com.backend.be_realestate.modals.dto.order;

import com.backend.be_realestate.modals.dto.UserSimpleDTO;
import lombok.Data;

import java.util.List;

@Data
public class AdminOrderDetailDTO {
    private Long orderId;
    private String status;
    private Long subtotal;
    private Long discount;
    private Long total;

    // Các trường FE bị thiếu (thêm vào)
    private String createdAt;   // Thêm vào (dùng format ISO)
    private String updatedAt;   // Thêm vào (dùng format ISO)
    private String method;      // Thêm vào
    private UserSimpleDTO user; // Thêm vào (object user)

    // Danh sách items chi tiết (thay vì chỉ 'primaryItem')
    private List<OrderItemDTO> items;
}
