package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.OrderConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.*;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ListingPackageRepository listingPackageRepository;
    private final OrderConverter orderConverter;
    private final ObjectMapper objectMapper;

    private final UserRepository userRepository;

    private final UserInventoryRepository inventoryRepository;

    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    // ===================== CREATE ORDER =====================
    @Override
    @Transactional
    public OrderDTO createOrder(CheckoutReq req) {
        // 1. Lấy thông tin User
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        UserEntity currentUser = userRepository.findByEmail(currentUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + currentUsername));

        // 2. Normalize giỏ hàng
        Map<String, Integer> qtyMap = new LinkedHashMap<>();
        req.getItems().forEach(it -> {
            String code = it.getCode();
            if (it.getQty() > 0 && code != null && !code.trim().isEmpty()) {
                qtyMap.merge(code.trim(), it.getQty(), Integer::sum);
            }
        });

        if (qtyMap.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng không chứa sản phẩm hợp lệ.");
        }

        // 3. Tạo OrderEntity và các OrderItemEntity TRONG BỘ NHỚ (CHƯA LƯU DB)
        OrderEntity order = new OrderEntity();
        order.setUser(currentUser);
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        long calculatedSubtotal = 0L;

        List<String> codes = new ArrayList<>(qtyMap.keySet());
        for (String code : codes) {
            ListingPackage p = listingPackageRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalArgumentException("Gói không hợp lệ/không hoạt động: " + code));

            int quantity = qtyMap.get(code);
            long unitPrice = Math.round(p.getPrice() == null ? 0d : p.getPrice());
            long lineTotal = unitPrice * (long) quantity;
            calculatedSubtotal += lineTotal;

            // Tạo OrderItem
            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setProductId(p.getId());
            orderItem.setProductCode(p.getCode());
            orderItem.setTitle(p.getName());
            orderItem.setItemType(p.getPackageType() == null
                    ? ItemType.SINGLE
                    : ItemType.valueOf(p.getPackageType().name()));
            orderItem.setListingType(p.getListingType());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQty(quantity);
            orderItem.setLineTotal(lineTotal);

            // Liên kết OrderItem với Order (quan trọng!)
            order.addItem(orderItem);
        }
        order.setSubtotal(calculatedSubtotal);
        order.setTotal(calculatedSubtotal); // Giả sử total = subtotal

        OrderEntity savedOrder = orderRepository.save(order);

        notificationService.createNotification(
                currentUser,
                NotificationType.ORDER_PENDING,
                "Đơn hàng #" + savedOrder.getId() + " của bạn đã được tạo, vui lòng thanh toán.",
                "/dashboard/orders?order_id=" + savedOrder.getId() // Link cho user
        );

        // 6. Trả về DTO
        return orderConverter.toDto(savedOrder, savedOrder.getItems());
    }


    // ===================== GET DETAIL =====================
    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderDetail(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return null;
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return orderConverter.toDto(order, items);
    }

    // ===================== GET ALL =====================
    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        List<OrderEntity> orders = orderRepository.findAll();
        return orders.stream()
                .map(order -> orderConverter.toDto(order, orderItemRepository.findByOrderId(order.getId())))
                .toList();
    }

    // =================================================================
    //  PHƯƠNG THỨC XỬ LÝ CHÍNH KHI ĐƠN HÀNG ĐƯỢC THANH TOÁN
    // =================================================================

    @Override
    public List<Map<String, Object>> getOrdersByUserId(Long userId) {
        List<OrderEntity> orders = orderRepository.findOrdersByUserId(userId);

        List<Map<String, Object>> results = new ArrayList<>();
        for (OrderEntity order : orders) {
            // a. Chuyển đổi sang DTO cơ bản (không có userName)
            OrderDTO baseDto = orderConverter.toDto(order);

            // b. Dùng ObjectMapper để chuyển DTO thành Map
            Map<String, Object> orderMap = objectMapper.convertValue(baseDto, Map.class);

            // c. Thêm thủ công trường userName vào Map
            if (order.getUser() != null) {
                orderMap.put("userName", order.getUser().getLastName() + " " + order.getUser().getFirstName());
            } else {
                orderMap.put("userName", "N/A");
            }

            results.add(orderMap);
        }

        return results;
    }

    /**
     * Hàm trợ giúp để cộng vật phẩm từ một OrderItem vào kho của người dùng.
     */
    private void creditItemsFromOrderItem(UserEntity user, OrderItemEntity orderItem) {
        // Trường hợp 1: Gói đơn (SINGLE)
        if (orderItem.getItemType() == ItemType.SINGLE) {
            String itemType = orderItem.getListingType().name(); // Ví dụ: "PREMIUM", "VIP"
            int quantityToAdd = orderItem.getQty();
            updateUserInventory(user, itemType, quantityToAdd);
        }
        // Trường hợp 2: Gói Combo (COMBO)
        else if (orderItem.getItemType() == ItemType.COMBO) {
            ListingPackage comboPackage = listingPackageRepository.findByCode(orderItem.getProductCode())
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy thông tin gói combo: " + orderItem.getProductCode()));

            for (PackageItem itemInCombo : comboPackage.getItems()) {
                String itemType = itemInCombo.getListingType().name();
                int quantityToAdd = itemInCombo.getQuantity() * orderItem.getQty();
                updateUserInventory(user, itemType, quantityToAdd);
            }
        }
    }

    /**
     * Hàm lõi: Cập nhật kho đồ của người dùng.
     */
    private void updateUserInventory(UserEntity user, String itemType, int quantityToAdd) {
        UserInventoryEntity inventoryItem = inventoryRepository
                .findByUserAndItemType(user, itemType)
                .orElseGet(() -> {
                    UserInventoryEntity newItem = new UserInventoryEntity();
                    newItem.setUser(user);
                    newItem.setItemType(itemType);
                    newItem.setQuantity(0);
                    return newItem;
                });

        inventoryItem.setQuantity(inventoryItem.getQuantity() + quantityToAdd);
        inventoryRepository.save(inventoryItem);
    }

    @Transactional
    public void createPendingTransaction(OrderEntity order, PaymentIntent paymentIntent) {
        // TODO: Viết logic để xác định type dựa trên sản phẩm của order
        // Ví dụ đơn giản:
        TransactionType type = TransactionType.PACKAGE_PURCHASE; // Giả sử là mua gói

        TransactionEntity transaction = TransactionEntity.builder()
                .order(order)
                .stripePaymentIntentId(paymentIntent.getId())
                .amount(paymentIntent.getAmount())
                .status(TransactionStatus.PENDING)
                .type(type)
                .build();
        transactionRepository.save(transaction);
        log.info("Đã tạo giao dịch PENDING cho orderId={} và pi={}", order.getId(), paymentIntent.getId());
    }

    /**
     * Logic để hoàn tất đơn hàng và cập nhật giao dịch thành SUCCEEDED.
     * Sẽ được gọi từ StripeWebhookController.
     */
    @Override
    @Transactional
    public void fulfillOrder(PaymentIntent paymentIntent) {
        log.info("--- Bắt đầu FULFILL ORDER cho pi={} ---", paymentIntent.getId());
        try {
            String piId = paymentIntent.getId();

            TransactionEntity transaction = transactionRepository.findByStripePaymentIntentId(piId)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy giao dịch cho payment_intent_id: " + piId));
            log.info("Đã tìm thấy transactionId={} với trạng thái {}", transaction.getId(), transaction.getStatus());

            if (transaction.getStatus() == TransactionStatus.SUCCEEDED) {
                log.warn("Transaction đã SUCCEEDED, bỏ qua.");
                return;
            }

            transaction.setStatus(TransactionStatus.SUCCEEDED);
            transactionRepository.save(transaction);
            log.info("Đã cập nhật transactionId={} thành SUCCEEDED", transaction.getId());

            Long orderId = transaction.getOrder().getId();
            log.info("Chuẩn bị gọi processPaidOrder cho orderId={}", orderId);
            this.processPaidOrder(orderId);
            log.info("--- Kết thúc FULFILL ORDER thành công cho pi={} ---", piId);
        } catch (Exception e) {
            log.error("!!! Lỗi trong quá trình fulfillOrder cho pi={}", paymentIntent.getId(), e);
            throw new RuntimeException("Lỗi khi fulfill order", e); // Re-throw để transaction rollback
        }
    }

    @Override
    @Transactional
    public void processPaidOrder(Long orderId) {
        log.info("--- Bắt đầu PROCESS PAID ORDER cho orderId={} ---", orderId);
        try {
            OrderEntity order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với ID: " + orderId));

            if (order.getStatus() == OrderStatus.PAID) {
                log.warn("Order {} đã ở trạng thái PAID, bỏ qua.", orderId);
                return;
            }

            // ----- Logic nghiệp vụ chính (giữ nguyên) -----
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            log.info("Đã cập nhật orderId={} thành PAID", order.getId());

            UserEntity user = order.getUser();
            for (OrderItemEntity orderItem : order.getItems()) {
                creditItemsFromOrderItem(user, orderItem);
            }
            log.info("Đã cộng vật phẩm thành công cho orderId={}", orderId);
            // ----- Kết thúc logic nghiệp vụ chính -----


            // ===== BẮT ĐẦU THÊM MỚI: LOGIC NOTIFICATION =====
            // Đặt trong try-catch riêng để nếu gửi noti lỗi cũng KHÔNG rollback nghiệp vụ chính
            try {
                // 1. Gửi thông báo cho NGƯỜI DÙNG
                notificationService.createNotification(
                        user,
                        NotificationType.PACKAGE_PURCHASED, // (Enum bạn đã tạo)
                        "Thanh toán thành công cho đơn hàng #" + order.getId() + ". Gói tin đã được cộng vào tài khoản.",
                        "/dashboard/transactions?order_id=" + order.getId()
                );

                // 2. Gửi thông báo cho TẤT CẢ ADMIN
                List<UserEntity> admins = userRepository.findByRoleName("ADMIN"); // (Sửa "ADMIN" nếu tên Role của bạn khác)

                String messageToAdmin = "Đơn hàng #" + order.getId() +
                        " vừa được thanh toán thành công bởi " + user.getEmail() +
                        " với tổng tiền " + order.getTotal() + " VND."; // Dùng order.getTotal() như bạn nói
                String linkToAdmin = "/admin/orders/" + order.getId();

                for (UserEntity admin : admins) {
                    notificationService.createNotification(
                            admin,
                            NotificationType.NEW_ORDER_PAID, // (Enum bạn đã tạo)
                            messageToAdmin,
                            linkToAdmin
                    );
                }
                log.info("Đã gửi thông báo thanh toán thành công cho user và admin.");

            } catch (Exception e) {
                // Rất quan trọng: Bắt lỗi để không ảnh hưởng luồng chính
                log.error("!!! Lỗi khi gửi notification cho orderId={}. Lỗi: {}", orderId, e.getMessage());
            }
            // ===== KẾT THÚC LOGIC NOTIFICATION =====


            log.info("--- Kết thúc PROCESS PAID ORDER thành công cho orderId={} ---", orderId);
        } catch (Exception e) {
            log.error("!!! Lỗi trong quá trình processPaidOrder cho orderId={}", orderId, e);
            throw new RuntimeException("Lỗi khi process paid order", e); // Re-throw để transaction rollback
        }
    }

}