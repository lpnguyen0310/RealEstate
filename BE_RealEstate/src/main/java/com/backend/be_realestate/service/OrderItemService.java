package com.backend.be_realestate.service;

import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import com.backend.be_realestate.modals.dto.transactions.RecentTransactionDTO;

import java.util.List;

public interface OrderItemService {
    List<OrderItemDTO> getItemsByOrder(Long orderId);
    List<RecentTransactionDTO> recentTransactions(List<OrderStatus> statuses, int page, int size);

}
