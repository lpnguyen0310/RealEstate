package com.backend.be_realestate.service;

import com.backend.be_realestate.entity.OrderEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.exceptions.InsufficientBalanceException;
import com.backend.be_realestate.modals.dto.order.AdminOrderDetailDTO;
import com.backend.be_realestate.modals.dto.order.AdminOrderListDTO;
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

    // 1. Tìm kiếm Admin (Đã thêm dateRange)
    PageResponse<AdminOrderListDTO> adminSearchOrders(String q, String status, String method, String dateRange, Pageable pageable);

    // 2. Hành động đơn lẻ
    void adminMarkPaid(Long id);
    void adminCancelOrder(Long id);
    void adminRefundOrder(Long id);

    // 3. Hành động hàng loạt
    void adminBulkAction(List<Long> ids, String action);

    AdminOrderDetailDTO getAdminOrderDetail(Long orderId);

    OrderEntity createTopUpOrder(UserEntity user, Long amount);

    OrderDTO payWithBalance(Long orderId, String userEmail) throws InsufficientBalanceException;
}
