package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;

import java.util.List;

public interface OrderService {
    OrderDTO createOrder(CheckoutReq req);
    OrderDTO getOrderDetail(Long orderId);
    List<OrderDTO> getAllOrders();
    void processPaidOrder(Long orderId);
}
