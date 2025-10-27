package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.OrderItemConverter;
import com.backend.be_realestate.entity.OrderItemEntity;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.transactions.RecentTransactionDTO;
import com.backend.be_realestate.repository.OrderItemRepository;
import com.backend.be_realestate.service.OrderItemService;
import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemConverter orderItemConverter;

    @Override
    @Transactional(readOnly = true)
    public List<OrderItemDTO> getItemsByOrder(Long orderId) {
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return orderItemConverter.toDtoList(items);
    }

    @Override
    public List<RecentTransactionDTO> recentTransactions(List<OrderStatus> statuses, int page, int size) {
        return orderItemRepository.findRecentTransactions(statuses, PageRequest.of(page, size));

    }
}
