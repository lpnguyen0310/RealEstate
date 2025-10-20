package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.OrderEntity;
import com.backend.be_realestate.entity.OrderItemEntity;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderConverter {

    private final ModelMapper modelMapper;
    private final OrderItemConverter orderItemConverter;

    /** Dùng khi đã fetch items riêng (khuyến nghị trong service) */
    public OrderDTO toDto(OrderEntity order, List<OrderItemEntity> items) {
        if (order == null) return null;

        // map nhanh các field trùng tên (subtotal, discount, total)
        OrderDTO dto = modelMapper.map(order, OrderDTO.class);

        // CHUẨN HOÁ/điều chỉnh các field đặc biệt
        dto.setOrderId(order.getId()); // id -> orderId
        dto.setStatus(order.getStatus() == null ? null : order.getStatus().name());
        dto.setSubtotal(safeLong(order.getSubtotal()));
        dto.setDiscount(safeLong(order.getDiscount()));
        dto.setTotal(safeLong(order.getTotal()));

        if (order.getUser() != null) {
            dto.setUserId(order.getUser().getUserId());
        }

        if (order.getCreatedAt() != null) {
            Date oldDate = order.getCreatedAt();
            String formattedDate = oldDate.toInstant()
                    .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            dto.setCreatedAt(formattedDate);
        }

        // Map danh sách items (bên trong OrderItemConverter vẫn dùng modelMapper + chuẩn hoá)
        dto.setItems(orderItemConverter.toDtoList(items));

        return dto;
    }

    /** Dùng trực tiếp nếu order.getItems() đã được fetch (tránh lazy exception) */
    public OrderDTO toDto(OrderEntity order) {
        List<OrderItemEntity> items = order != null && order.getItems() != null ? order.getItems() : List.of();
        return toDto(order, items);
    }

    // ------- helpers -------
    private Long safeLong(Long v) { return v == null ? 0L : v; }
}
