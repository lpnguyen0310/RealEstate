package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.dto.order.OrderSimpleDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.OrderKpiResponse;
import com.stripe.model.PaymentIntent;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface OrderService {
    OrderDTO createOrder(CheckoutReq req);
    OrderDTO getOrderDetail(Long orderId);
    List<OrderDTO> getAllOrders();
    void processPaidOrder(Long orderId);
    List<Map<String, Object>> getOrdersByUserId(Long userId);
    void fulfillOrder(PaymentIntent paymentIntent);

    OrderKpiResponse ordersKpi(String range, String status); // status: PAID/DRAFT/... hoặc null
    PageResponse<OrderSimpleDTO> getRecentOrders(String keyword, Pageable pageable);

}
