package com.backend.be_realestate.modals.dto.order;

import com.backend.be_realestate.entity.OrderEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderSimpleDTO {
    private Long id;
    private String orderCode;    // dùng để hiển thị FE
    private String customerName;
    private Long total;
    private String status;
    private String createdAt;

    public static OrderSimpleDTO fromEntity(OrderEntity e) {
        return OrderSimpleDTO.builder()
                .id(e.getId())
                .orderCode("ORD-" + String.format("%06d", e.getId()))
                .customerName(e.getUser() != null ? e.getUser().getFirstName() + " " + e.getUser().getLastName() : "(Ẩn danh)")
                .total(e.getTotal())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt() != null
                        ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(e.getCreatedAt())
                        : null)
                .build();
    }
}
