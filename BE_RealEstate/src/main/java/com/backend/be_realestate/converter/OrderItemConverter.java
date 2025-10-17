package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.OrderItemEntity;
import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class OrderItemConverter {

    private final ModelMapper modelMapper;

    public OrderItemDTO toDto(OrderItemEntity it) {
        if (it == null) return null;

        // map nhanh các field trùng tên (title, unitPrice, qty, lineTotal)
        OrderItemDTO dto = modelMapper.map(it, OrderItemDTO.class);

        // CHUẨN HOÁ/điều chỉnh các field đặc biệt
        dto.setItemType(it.getItemType() == null ? null : it.getItemType().name());
        dto.setListingType(it.getListingType() == null ? null : it.getListingType().name());
        dto.setUnitPrice(safeLong(it.getUnitPrice()));
        dto.setQty(safeInt(it.getQty()));
        dto.setLineTotal(safeLong(it.getLineTotal()));

        return dto;
    }

    public List<OrderItemDTO> toDtoList(List<OrderItemEntity> items) {
        if (items == null || items.isEmpty()) return List.of();
        return items.stream().filter(Objects::nonNull).map(this::toDto).toList();
    }

    // ------- helpers -------
    private Long safeLong(Long v) { return v == null ? 0L : v; }
    private int  safeInt(Integer v){ return v == null ? 0   : v; }
}
