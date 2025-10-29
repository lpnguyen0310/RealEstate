package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.OrderConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.*;
import com.backend.be_realestate.modals.dto.order.*;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.OrderKpiResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.util.*;
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
    private static final ZoneId ZONE_VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String TZ_OFFSET = "+07:00";
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

        PaymentMethod method;
        try {
            String methodStr = req.getMethod() != null ? req.getMethod().toUpperCase() : "STRIPE";
            method = PaymentMethod.valueOf(methodStr);
        } catch (IllegalArgumentException e) {
            log.warn("Phương thức thanh toán không hợp lệ trong request: {}. Mặc định là STRIPE.", req.getMethod());
            method = PaymentMethod.STRIPE;
        }
        order.setMethod(method);

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
    public OrderKpiResponse ordersKpi(String range, String status) {
        LocalDate today = LocalDate.now(ZONE_VN);
        Range cur = resolveRange(range, today);
        Range prev = previousRange(cur);

        Instant cs = cur.start.atZone(ZONE_VN).toInstant();
        Instant ce = cur.end.atZone(ZONE_VN).toInstant();
        Instant ps = prev.start.atZone(ZONE_VN).toInstant();
        Instant pe = prev.end.atZone(ZONE_VN).toInstant();

        String st = (status == null || status.isBlank()) ? "PAID" : status.toUpperCase();

        long curOrders = orderRepository.countOrdersBetween(cs, ce, st);
        long prevOrders = orderRepository.countOrdersBetween(ps, pe, st);
        long curRevenue = Optional.ofNullable(orderRepository.sumRevenueBetween(cs, ce, st)).orElse(0L);
        long prevRevenue = Optional.ofNullable(orderRepository.sumRevenueBetween(ps, pe, st)).orElse(0L);

        double cmpOrders = (prevOrders == 0) ? (curOrders > 0 ? 1.0 : 0.0) : (double) (curOrders - prevOrders) / prevOrders;
        double cmpRevenue = (prevRevenue == 0) ? (curRevenue > 0 ? 1.0 : 0.0) : (double) (curRevenue - prevRevenue) / prevRevenue;

        List<Object[]> rows = orderRepository.dailyOrderSeries(cs, ce, TZ_OFFSET, st);
        Map<LocalDate, SeriesRow> map = new LinkedHashMap<>();
        for (LocalDate d = cur.start.toLocalDate(); !d.isAfter(cur.end.toLocalDate().minusDays(1)); d = d.plusDays(1)) {
            map.put(d, new SeriesRow(0L, 0L));
        }
        for (Object[] r : rows) {
            LocalDate day = LocalDate.parse(String.valueOf(r[0]));
            long orders = ((Number) r[1]).longValue();
            long revenue = ((Number) r[2]).longValue();
            map.put(day, new SeriesRow(orders, revenue));
        }

        List<OrderKpiResponse.SeriesPoint> series = new ArrayList<>();
        map.forEach((d, val) -> series.add(
                OrderKpiResponse.SeriesPoint.builder()
                        .date(d.toString()).orders(val.orders).revenue(val.revenue).build()
        ));

        return OrderKpiResponse.builder()
                .summary(OrderKpiResponse.Summary.builder()
                        .orders(curOrders)
                        .revenue(curRevenue)
                        .compareOrders(cmpOrders)
                        .compareRevenue(cmpRevenue)
                        .build())
                .series(series)
                .range(OrderKpiResponse.RangeDto.builder()
                        .start(cur.start.toString()).end(cur.end.toString()).build())
                .build();
    }

    @Override
    public PageResponse<OrderSimpleDTO> getRecentOrders(String keyword, Pageable pageable) {
        Page<OrderEntity> page;

        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();

            // Nếu keyword là số → coi như tìm theo id (mã đơn)
            Long id = parseLongOrNull(kw);
            if (id != null) {
                Optional<OrderEntity> one = orderRepository.findById(id);
                List<OrderEntity> list = one.map(List::of).orElseGet(List::of);
                page = new PageImpl<>(list, pageable, list.size());
            } else {
                page = orderRepository.findRecentByCustomerName(kw, pageable);
            }
        } else {
            page = orderRepository.findRecent(pageable);
        }

        return PageResponse.from(page.map(OrderSimpleDTO::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminOrderListDTO> adminSearchOrders(String q, String status, String method, String dateRange, Pageable pageable) {
        // 1. Phân tích tham số Enum
        OrderStatus orderStatus = status.equalsIgnoreCase("ALL") ? null : OrderStatus.valueOf(status.toUpperCase());
        PaymentMethod paymentMethod = method.equalsIgnoreCase("ALL") ? null : PaymentMethod.valueOf(method.toUpperCase());

        // 2. Tính toán khoảng thời gian (sử dụng hàm resolveRange đã có)
        Range range = resolveRange(dateRange, LocalDate.now(ZONE_VN));

        // --- SỬA LỖI CHUYỂN ĐỔI KIỂU DỮ LIỆU ---
        // Chuyển LocalDateTime sang Instant, sau đó sang java.util.Date
        Date startDate = Date.from(range.start.atZone(ZONE_VN).toInstant());
        Date endDate = Date.from(range.end.atZone(ZONE_VN).toInstant());

        // 3. GỌI REPOSITORY: Truyền các đối tượng Date đã được chuyển đổi
        Page<OrderEntity> page = orderRepository.adminSearch(
                q, orderStatus, paymentMethod, startDate, endDate, pageable // Đã sửa startDate, endDate
        );

        // 4. Chuyển đổi Page<Entity> sang PageResponse<DTO>
        Page<AdminOrderListDTO> dtoPage = page.map(order -> {
            List<OrderItemEntity> items = orderItemRepository.findByOrderId(order.getId());
            return orderConverter.toAdminListDto(order, items); // <-- SỬ DỤNG DTO CHUYÊN BIỆT
        });

        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public void adminMarkPaid(Long id) {
        // Tái sử dụng logic nghiệp vụ chính (processPaidOrder) để đảm bảo cập nhật trạng thái PAID,
        // cộng vật phẩm vào kho và gửi thông báo.
        this.processPaidOrder(id);
        // Nếu processPaidOrder không có cơ chế log/ghi timeline, bạn có thể thêm:
        // log.info("Admin manually marked order {} as PAID", id);
    }

    @Override
    @Transactional
    public void adminCancelOrder(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại: " + id));

        // Điều kiện: chỉ hủy nếu trạng thái cho phép (ví dụ: PENDING, UNPAID, PAID)
        if (order.getStatus() == OrderStatus.CANCELED || order.getStatus() == OrderStatus.REFUNDED) {
            log.warn("Cannot cancel order {} in status {}", id, order.getStatus());
            return;
        }

        order.setStatus(OrderStatus.CANCELED);
        orderRepository.save(order);
        // TODO: Bổ sung logic hủy: hoàn tiền tự động nếu trạng thái cũ là PAID.
        log.info("Admin canceled order {}", id);
    }

    @Override
    @Transactional
    public void adminRefundOrder(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại: " + id));

        // Điều kiện: chỉ hoàn tiền đơn đã PAID
        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("Chỉ có thể hoàn tiền đơn hàng đã thanh toán. Trạng thái hiện tại: " + order.getStatus());
        }

        // Yêu cầu bạn đã thêm OrderStatus.REFUNDED vào Enum
        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

        // TODO: THỰC HIỆN HOÀN TIỀN THỰC TẾ QUA CỔNG THANH TOÁN (Ví dụ: Stripe API refund call)
        log.info("Admin refunded order {}", id);
    }

    @Override
    @Transactional
    public void adminBulkAction(List<Long> ids, String action) {
        if (ids == null || ids.isEmpty()) return;

        for (Long id : ids) {
            // Tái sử dụng các hàm xử lý đơn lẻ để đảm bảo logic nhất quán và xử lý lỗi
            try {
                switch (action.toLowerCase()) {
                    case "paid":
                        adminMarkPaid(id);
                        break;
                    case "cancel":
                        adminCancelOrder(id);
                        break;
                    case "refund":
                        adminRefundOrder(id);
                        break;
                    default:
                        log.warn("Bulk action không hợp lệ: {}", action);
                }
            } catch (Exception e) {
                // Log lỗi nhưng không dừng toàn bộ bulk action
                log.error("Failed to perform bulk action '{}' on order {}: {}", action, id, e.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderDetailDTO getAdminOrderDetail(Long orderId) {
        // 1. Tìm Order, báo lỗi nếu không thấy
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với ID: " + orderId));

        // 2. Lấy danh sách items
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);

        // 3. Gọi hàm converter MỚI (toAdminDetailDto) mà bạn đã tạo ở bước trước
        return orderConverter.toAdminDetailDto(order, items);
    }

    private Long parseLongOrNull(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return null; }
    }

    private static class SeriesRow {
        long orders; long revenue;
        SeriesRow(long o, long r) { this.orders = o; this.revenue = r; }
    }

    private static class Range { LocalDateTime start; LocalDateTime end;
        Range(LocalDateTime s, LocalDateTime e) { this.start = s; this.end = e; }
    }

    private Range resolveRange(String key, LocalDate today) {
        String k = key == null ? "" : key;
        switch (k) {
            case "today": {
                LocalDateTime start = today.atStartOfDay();
                return new Range(start, start.plusDays(1));
            }
            case "last_7d": {
                LocalDate endDay = today.plusDays(1);
                return new Range(endDay.minusDays(7).atStartOfDay(), endDay.atStartOfDay());
            }
            case "this_month": {
                LocalDate first = today.withDayOfMonth(1);
                return new Range(first.atStartOfDay(), first.plusMonths(1).atStartOfDay());
            }
            case "last_month": {
                LocalDate firstPrev = today.withDayOfMonth(1).minusMonths(1);
                return new Range(firstPrev.atStartOfDay(), firstPrev.plusMonths(1).atStartOfDay());
            }
            case "last_30d":
            default: {
                LocalDate endDay = today.plusDays(1);
                return new Range(endDay.minusDays(30).atStartOfDay(), endDay.atStartOfDay());
            }
        }
    }

    private Range previousRange(Range cur) {
        Duration len = Duration.between(cur.start, cur.end);
        LocalDateTime prevEnd = cur.start;
        LocalDateTime prevStart = prevEnd.minus(len);
        return new Range(prevStart, prevEnd);
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