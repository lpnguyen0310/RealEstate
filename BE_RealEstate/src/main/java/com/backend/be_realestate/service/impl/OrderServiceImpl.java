package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.OrderConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.*;
import com.backend.be_realestate.exceptions.InsufficientBalanceException;
import com.backend.be_realestate.modals.dto.order.*;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.modals.response.admin.OrderKpiResponse;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.service.TransactionService;
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

import java.math.BigDecimal; // <-- Đã thêm
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
    private final TransactionService transactionService;

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
        // ... (Giữ nguyên logic lấy user và normalize giỏ hàng)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        UserEntity currentUser = userRepository.findByEmail(currentUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + currentUsername));

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

        // 3. Tạo OrderEntity
        OrderEntity order = new OrderEntity();
        order.setUser(currentUser);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setType(OrderType.PACKAGE_PURCHASE); // <-- SỬA ĐỔI QUAN TRỌNG

        // ... (Giữ nguyên logic PaymentMethod)
        PaymentMethod method;
        try {
            String methodStr = req.getMethod() != null ? req.getMethod().toUpperCase() : "STRIPE";
            method = PaymentMethod.valueOf(methodStr);
        } catch (IllegalArgumentException e) {
            log.warn("Phương thức thanh toán không hợp lệ trong request: {}. Mặc định là STRIPE.", req.getMethod());
            method = PaymentMethod.STRIPE;
        }
        order.setMethod(method);

        // ... (Giữ nguyên logic tạo OrderItem và tính toán)
        long calculatedSubtotal = 0L;

        List<String> codes = new ArrayList<>(qtyMap.keySet());
        for (String code : codes) {
            ListingPackage p = listingPackageRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalArgumentException("Gói không hợp lệ/không hoạt động: " + code));

            int quantity = qtyMap.get(code);
            long unitPrice = Math.round(p.getPrice() == null ? 0d : p.getPrice());
            long lineTotal = unitPrice * (long) quantity;
            calculatedSubtotal += lineTotal;

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

            order.addItem(orderItem);
        }
        order.setSubtotal(calculatedSubtotal);
        order.setTotal(calculatedSubtotal);

        OrderEntity savedOrder = orderRepository.save(order);

        // ... (Giữ nguyên logic gửi Notification)
        notificationService.createNotification(
                currentUser,
                NotificationType.ORDER_PENDING,
                "Đơn hàng #" + savedOrder.getId() + " của bạn đã được tạo, vui lòng thanh toán.",
                "/dashboard/orders?order_id=" + savedOrder.getId()
        );

        return orderConverter.toDto(savedOrder, savedOrder.getItems());
    }


    // ===================== GET DETAIL =====================
    // ... (Giữ nguyên getOrderDetail, getAllOrders, getOrdersByUserId)
    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderDetail(Long orderId) {
        OrderEntity order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return null;
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return orderConverter.toDto(order, items);
    }
    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        List<OrderEntity> orders = orderRepository.findAll();
        return orders.stream()
                .map(order -> orderConverter.toDto(order, orderItemRepository.findByOrderId(order.getId())))
                .toList();
    }
    @Override
    public List<Map<String, Object>> getOrdersByUserId(Long userId) {
        List<OrderEntity> orders = orderRepository.findOrdersByUserId(userId);
        List<Map<String, Object>> results = new ArrayList<>();
        for (OrderEntity order : orders) {
            OrderDTO baseDto = orderConverter.toDto(order);
            Map<String, Object> orderMap = objectMapper.convertValue(baseDto, Map.class);
            if (order.getUser() != null) {
                orderMap.put("userName", order.getUser().getLastName() + " " + order.getUser().getFirstName());
            } else {
                orderMap.put("userName", "N/A");
            }
            results.add(orderMap);
        }
        return results;
    }

    // ... (Giữ nguyên creditItemsFromOrderItem, updateUserInventory)
    private void creditItemsFromOrderItem(UserEntity user, OrderItemEntity orderItem) {
        if (orderItem.getItemType() == ItemType.SINGLE) {
            // Logic cho Gói Lẻ (SINGLE) vẫn đúng, giữ nguyên
            String itemType = orderItem.getListingType().name();
            int quantityToAdd = orderItem.getQty();
            updateUserInventory(user, itemType, quantityToAdd);
        }
        else if (orderItem.getItemType() == ItemType.COMBO) {

            // ===== BẮT ĐẦU LOGIC MỚI CHO COMBO =====

            // Dùng ProductId (Long) để tìm Gói Combo, an toàn hơn dùng Code (String)
            ListingPackage comboPackage = listingPackageRepository.findById(orderItem.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy thông tin gói combo ID: " + orderItem.getProductId()));

            // Duyệt qua các PackageItem (các mục con đã trỏ đến Gói Lẻ)
            for (PackageItem itemInCombo : comboPackage.getItems()) {

                // 1. Lấy ra "Gói Lẻ" (childPackage) mà admin đã chọn
                // (Giả sử PackageItem đã được sửa để có getChildPackage())
                ListingPackage childPackage = itemInCombo.getChildPackage();

                if (childPackage == null) {
                    log.error("PackageItem ID: {} không trỏ đến childPackage hợp lệ.", itemInCombo.getId());
                    continue;
                }

                // 2. Lấy "Loại tin gốc" (Enum) từ Gói Lẻ đó
                ListingType itemTypeEnum = childPackage.getListingType();

                if (itemTypeEnum == null) {
                    log.error("Gói Lẻ (ID: {}) trong combo (ID: {}) không có ListingType (Enum)", childPackage.getId(), comboPackage.getId());
                    continue; // Bỏ qua nếu gói lẻ không hợp lệ
                }

                String itemType = itemTypeEnum.name();

                // 3. Nhân số lượng của Gói Lẻ VỚI số lượng combo mà user mua
                int quantityToAdd = itemInCombo.getQuantity() * orderItem.getQty();

                // 4. Cộng vào kho (Logic kho cũ vẫn hoạt động)
                updateUserInventory(user, itemType, quantityToAdd);
            }
            // ===== KẾT THÚC LOGIC MỚI =====
        }
    }
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

        int newQuantity = inventoryItem.getQuantity() + quantityToAdd;

        // Ngăn số lượng bị âm
        if (newQuantity < 0) {
            log.warn("Thao tác kho (thêm/bớt) cho user {} vật phẩm {} (số lượng {}) sẽ dẫn" +
                            " đến số dư âm ({}). Đặt số lượng về 0.",
                    user.getEmail(), itemType, quantityToAdd, newQuantity);
            inventoryItem.setQuantity(0);
        } else {
            inventoryItem.setQuantity(newQuantity);
        }

        inventoryRepository.save(inventoryItem);
    }

    @Transactional
    public void createPendingTransaction(OrderEntity order, PaymentIntent paymentIntent) {
        // <-- SỬA ĐỔI QUAN TRỌNG: Xóa TODO và thêm logic -->
        // Xác định loại Transaction dựa trên OrderType
        TransactionType type;
        if (order.getType() == OrderType.TOP_UP) {
            type = TransactionType.TOP_UP;
        } else {
            type = TransactionType.PACKAGE_PURCHASE;
        }
        // <-- KẾT THÚC SỬA ĐỔI -->

        TransactionEntity transaction = TransactionEntity.builder()
                .order(order)
                .stripePaymentIntentId(paymentIntent.getId())
                .amount(paymentIntent.getAmount())
                .status(TransactionStatus.PENDING)
                .type(type) // <-- Đã được gán đúng
                .build();
        transactionRepository.save(transaction);
        log.info("Đã tạo giao dịch PENDING (type={}) cho orderId={} và pi={}", type, order.getId(), paymentIntent.getId());
    }

    /**
     * Logic để hoàn tất đơn hàng (Giữ nguyên)
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
            throw new RuntimeException("Lỗi khi fulfill order", e); // Re-throw
        }
    }

    // ... (Giữ nguyên các hàm admin kpi, search, ...)
    @Override
    public OrderKpiResponse ordersKpi(String range, String status) {
        // (Giữ nguyên code)
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
                        .previousOrders(prevOrders)
                        .previousRevenue(prevRevenue)
                        .build())
                .series(series)
                .range(OrderKpiResponse.RangeDto.builder()
                        .start(cur.start.toString()).end(cur.end.toString()).build())
                .build();
    }
    @Override
    public PageResponse<OrderSimpleDTO> getRecentOrders(String keyword, Pageable pageable) {
        // (Giữ nguyên code)
        Page<OrderEntity> page;
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
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
        // (Giữ nguyên code)
        OrderStatus orderStatus = status.equalsIgnoreCase("ALL") ? null : OrderStatus.valueOf(status.toUpperCase());
        PaymentMethod paymentMethod = method.equalsIgnoreCase("ALL") ? null : PaymentMethod.valueOf(method.toUpperCase());
        Range range = resolveRange(dateRange, LocalDate.now(ZONE_VN));
        Date startDate = Date.from(range.start.atZone(ZONE_VN).toInstant());
        Date endDate = Date.from(range.end.atZone(ZONE_VN).toInstant());
        Page<OrderEntity> page = orderRepository.adminSearch(
                q, orderStatus, paymentMethod, startDate, endDate, pageable
        );
        Page<AdminOrderListDTO> dtoPage = page.map(order -> {
            List<OrderItemEntity> items = orderItemRepository.findByOrderId(order.getId());
            return orderConverter.toAdminListDto(order, items);
        });
        return PageResponse.from(dtoPage);
    }
    @Override
    @Transactional
    public void adminMarkPaid(Long id) {
        this.processPaidOrder(id);
    }
    @Override
    @Transactional
    public void adminCancelOrder(Long id) {
        // (Giữ nguyên code)
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại: " + id));
        if (order.getStatus() == OrderStatus.CANCELED || order.getStatus() == OrderStatus.REFUNDED) {
            log.warn("Cannot cancel order {} in status {}", id, order.getStatus());
            return;
        }
        order.setStatus(OrderStatus.CANCELED);
        orderRepository.save(order);
        log.info("Admin canceled order {}", id);
    }
    // SỬA ĐỔI HOÀN TOÀN HÀM NÀY
    @Override
    @Transactional
    public void adminRefundOrder(Long id) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại: " + id));

        UserEntity user = order.getUser();

        if (user == null) {
            throw new IllegalStateException("Đơn hàng " + id + " không có thông tin người" +
                    " dùng, không thể hoàn tiền.");
        }

        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("Chỉ có thể hoàn tiền đơn hàng đã thanh toán." +
                    " Trạng thái hiện tại: " + order.getStatus());
        }

        // 1. Cập nhật trạng thái đơn hàng
        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);
        log.info("Admin refunded order {}", id);

        Long refundAmount = order.getTotal();

        // 2. Xử lý nghiệp vụ hoàn tiền
        // PHÂN LOẠI: Đơn nạp tiền hay đơn mua gói?
        if (order.getType() == OrderType.PACKAGE_PURCHASE) {
            // ---- A. Hoàn tiền đơn MUA GÓI ----

            // 2a. Hoàn tiền vào Main Balance (Store Credit)
            // Đây là cách đơn giản nhất. Admin hoàn tiền = cộng lại vào số dư chính.
            user.setMainBalance(user.getMainBalance() + refundAmount);
            log.info("Đã hoàn {} vào Main Balance cho user {} từ order {}",
                    refundAmount, user.getEmail(), id);

            // 2b. [QUAN TRỌNG] Trừ lại vật phẩm đã cộng (Reverse inventory)
            try {
                for (OrderItemEntity orderItem : order.getItems()) {
                    // Gọi hàm mới để trừ vật phẩm
                    debitItemsFromOrderItem(user, orderItem);
                }
                log.info("Đã trừ lại vật phẩm trong kho của user cho order {}", id);
            } catch (Exception e) {
                log.error("Lỗi nghiêm trọng: Không thể trừ vật phẩm khi hoàn tiền order {}. Lỗi:" +
                        " {}", id, e.getMessage());
                // Bạn có thể cân nhắc ném lỗi ở đây để rollback toàn bộ transaction
                throw new RuntimeException("Lỗi trừ vật phẩm, đã rollback", e);
            }

        } else if (order.getType() == OrderType.TOP_UP) {
            // ---- B. Hoàn tiền đơn NẠP TIỀN ----
            // Đơn nạp tiền đã cộng cả Main và Bonus
            // Logic hoàn tiền là phải TRỪ đi số tiền đã cộng.

            // 2a. Tính lại bonus đã cộng khi nạp
            Long originalAmount = order.getTotal();
            Long bonusCredited = calculateBonus(originalAmount);

            log.info("Order TOP_UP {} đã cộng {} (Main) và {} (Bonus). Bắt đầu trừ lại.",
                    id, originalAmount, bonusCredited);

            // 2b. Trừ tiền (Ưu tiên trừ bonus trước, main sau)
            Long currentMain = user.getMainBalance();
            Long currentBonus = user.getBonusBalance();

            Long bonusToDebit = bonusCredited;
            Long mainToDebit = originalAmount;

            // Trừ phần bonus trước
            if (currentBonus >= bonusToDebit) {
                user.setBonusBalance(currentBonus - bonusToDebit);
            } else {
                // Nếu bonus không đủ, trừ hết bonus và trừ phần còn thiếu vào Main
                log.warn("User {} không đủ Bonus ({}) để trừ {}. Trừ hết Bonus và trừ phần" +
                        " còn thiếu vào Main.", user.getEmail(), currentBonus, bonusToDebit);
                long deficit = bonusToDebit - currentBonus;
                user.setBonusBalance(0L);
                mainToDebit += deficit; // Tăng phần nợ ở Main
            }

            // Trừ phần main
            if (currentMain >= mainToDebit) {
                user.setMainBalance(currentMain - mainToDebit);
            } else {
                // Tình huống nguy hiểm: tài khoản không đủ tiền để hoàn
                log.error("LỖI HOÀN TIỀN: User {} không đủ Main Balance ({}) để trừ {}. Đặt Main" +
                        " về 0.", user.getEmail(), currentMain, mainToDebit);
                user.setMainBalance(0L);
                // GHI CHÚ: Admin cần được thông báo về trường hợp này
            }
        }

        // 3. Lưu lại thông tin user
        userRepository.save(user);

        // 4. Gửi thông báo cho user
        try {
            notificationService.createNotification(
                    user,
                    NotificationType.ORDER_REFUNDED, // <-- Bạn cần thêm Enum này
                    "Đơn hàng #" + order.getId() + " của bạn đã được hoàn tiền. Số tiền "
                            + refundAmount + " VND đã được xử lý.",
                    "/dashboard/transactions?order_id=" + order.getId()
            );
            log.info("Đã gửi thông báo hoàn tiền cho user {}", user.getEmail());
        } catch (Exception e) {
            log.error("!!! Lỗi khi gửi notification (REFUND) cho orderId={}. Lỗi: {}",
                    id, e.getMessage());
        }
    }
    // HÀM MỚI (Cần thêm vào)
// Dùng để trừ vật phẩm khi hoàn tiền đơn PACKAGE_PURCHASE
    private void debitItemsFromOrderItem(UserEntity user, OrderItemEntity orderItem) {
        if (orderItem.getItemType() == ItemType.SINGLE) {
            // Logic Gói Lẻ (SINGLE) vẫn đúng, giữ nguyên
            String itemType = orderItem.getListingType().name();
            int quantityToRemove = -orderItem.getQty(); // Dùng số âm
            updateUserInventory(user, itemType, quantityToRemove);
        }
        else if (orderItem.getItemType() == ItemType.COMBO) {

            // ===== BẮT ĐẦU LOGIC MỚI CHO COMBO (Hoàn tiền) =====

            ListingPackage comboPackage = listingPackageRepository.findById(orderItem.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy thông tin gói combo ID: " + orderItem.getProductId()));

            for (PackageItem itemInCombo : comboPackage.getItems()) {

                // 1. Lấy ra "Gói Lẻ" (childPackage)
                ListingPackage childPackage = itemInCombo.getChildPackage();

                if (childPackage == null) {
                    log.error("PackageItem ID: {} không trỏ đến childPackage hợp lệ. (Khi hoàn tiền)", itemInCombo.getId());
                    continue;
                }

                // 2. Lấy "Loại tin gốc" (Enum) từ Gói Lẻ đó
                ListingType itemTypeEnum = childPackage.getListingType();

                if (itemTypeEnum == null) {
                    log.error("Gói Lẻ (ID: {}) trong combo (ID: {}) không có ListingType (Enum). (Khi hoàn tiền)", childPackage.getId(), comboPackage.getId());
                    continue;
                }

                String itemType = itemTypeEnum.name();

                // 3. Tính số lượng cần TRỪ (dùng số âm)
                int quantityToRemove = -(itemInCombo.getQuantity() * orderItem.getQty());

                // 4. Trừ khỏi kho
                updateUserInventory(user, itemType, quantityToRemove);
            }
            // ===== KẾT THÚC LOGIC MỚI =====
        }
    }
    @Override
    @Transactional
    public void adminBulkAction(List<Long> ids, String action) {
        // (Giữ nguyên code)
        if (ids == null || ids.isEmpty()) return;
        for (Long id : ids) {
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
                log.error("Failed to perform bulk action '{}' on order {}: {}", action, id, e.getMessage());
            }
        }
    }
    @Override
    @Transactional(readOnly = true)
    public AdminOrderDetailDTO getAdminOrderDetail(Long orderId) {
        // (GiGREES_LATED nguyên code)
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với ID: " + orderId));
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return orderConverter.toAdminDetailDto(order, items);
    }

    // (Giữ nguyên)
    @Override
    @Transactional
    public OrderEntity createTopUpOrder(UserEntity user, Long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }

        OrderEntity order = new OrderEntity();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setMethod(PaymentMethod.STRIPE);
        order.setCurrency("VND");
        order.setSubtotal(amount);
        order.setTotal(amount);
        order.setType(OrderType.TOP_UP);

        OrderEntity savedOrder = orderRepository.save(order);

        notificationService.createNotification(
                user,
                NotificationType.ORDER_PENDING,
                "Yêu cầu nạp tiền #" + savedOrder.getId() + " đã được tạo, vui lòng thanh toán.",
                "/dashboard/wallet" // <-- Sửa lỗi chính tả từ "accout"
        );

        return savedOrder;
    }

    // ... (Giữ nguyên các hàm helper private)
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
        // (Giữ nguyên code)
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
        // (Giữ nguyên code)
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

            // ----- Cập nhật trạng thái ORDER -----
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            log.info("Đã cập nhật orderId={} thành PAID", order.getId());

            UserEntity user = order.getUser();
            OrderType type = order.getType();

            if (type == OrderType.TOP_UP) {
                Long amount = order.getTotal();
                Long bonus = calculateBonus(amount);
                user.setMainBalance(user.getMainBalance() + amount);
                user.setBonusBalance(user.getBonusBalance() + bonus);
                userRepository.save(user);

                log.info("Đã nạp {} (Thưởng: {}) vào tài khoản user {}", amount, bonus, user.getEmail());
                try {
                    notificationService.createNotification(
                            user,
                            NotificationType.TOP_UP_SUCCESSFUL,
                            "Nạp tiền thành công. +" + amount + " VND (Thưởng: " + bonus + " VND) đã được cộng vào tài khoản.",
                            "/dashboard/wallet"
                    );
                } catch (Exception e) {
                    log.error("!!! Lỗi khi gửi notification (TOP_UP) cho orderId={}. Lỗi: {}", orderId, e.getMessage());
                }

            } else if (type == OrderType.PACKAGE_PURCHASE) {
                for (OrderItemEntity orderItem : order.getItems()) {
                    creditItemsFromOrderItem(user, orderItem);
                }
                log.info("Đã cộng vật phẩm thành công cho orderId={}", orderId);

                try {
                    notificationService.createNotification(
                            user,
                            NotificationType.PACKAGE_PURCHASED,
                            "Thanh toán thành công cho đơn hàng #" + order.getId() + ". Gói tin đã được cộng vào tài khoản.",
                            "/dashboard/transactions?order_id=" + order.getId()
                    );

                    List<UserEntity> admins = userRepository.findByRoleName("ADMIN");
                    String messageToAdmin = "Đơn hàng #" + order.getId() +
                            " vừa được thanh toán thành công bởi " + user.getEmail() +
                            " với tổng tiền " + order.getTotal() + " VND.";
                    String linkToAdmin = "/admin/orders/" + order.getId();

                    for (UserEntity admin : admins) {
                        notificationService.createNotification(
                                admin,
                                NotificationType.NEW_ORDER_PAID,
                                messageToAdmin,
                                linkToAdmin
                        );
                    }
                    log.info("Đã gửi thông báo thanh toán (PACKAGE) thành công cho user và admin.");

                } catch (Exception e) {
                    log.error("!!! Lỗi khi gửi notification (PACKAGE) cho orderId={}. Lỗi: {}", orderId, e.getMessage());
                }

            } else {
                log.error("Order {} có OrderType không xác định: {}", orderId, type);
            }
            try {
                transactionService.markSucceededByOrderId(orderId);
                log.info("Đã cập nhật transaction thành SUCCEEDED cho orderId={}", orderId);
            } catch (Exception ex) {
                // Không được làm fail cả process chỉ vì transaction; chỉ log
                log.error("!!! Lỗi khi cập nhật transaction SUCCEEDED cho orderId={}", orderId, ex);
            }

            log.info("--- Kết thúc PROCESS PAID ORDER thành công cho orderId={} ---", orderId);
        } catch (Exception e) {
            log.error("!!! Lỗi trong quá trình processPaidOrder cho orderId={}", orderId, e);
            throw new RuntimeException("Lỗi khi process paid order", e);
        }
    }

    private Long calculateBonus(Long amount) {
        BigDecimal amountDecimal = BigDecimal.valueOf(amount);

        if (amountDecimal.compareTo(new BigDecimal("10000000")) == 0) {
            return 462963L;
        }
        if (amountDecimal.compareTo(new BigDecimal("5000000")) == 0) {
            return 231481L;
        }
        if (amountDecimal.compareTo(new BigDecimal("3000000")) == 0) {
            return 55556L;
        }
        if (amountDecimal.compareTo(new BigDecimal("2000000")) == 0) {
            return 37037L;
        }
        if (amountDecimal.compareTo(new BigDecimal("1000000")) == 0) {
            return 37037L;
        }
        if (amountDecimal.compareTo(new BigDecimal("500000")) == 0) {
            return 37037L;
        }

        return 0L; // Không có thưởng
    }

    @Override
    @Transactional
    public OrderDTO payWithBalance(Long orderId, String userEmail) throws InsufficientBalanceException {
        log.info("--- Bắt đầu PAY WITH BALANCE cho orderId={} bởi user={} ---", orderId, userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + userEmail));

        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại: " + orderId));

        if (!order.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("Bạn không có quyền thanh toán đơn hàng này.");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Đơn hàng không thể thanh toán bằng số dư ở trạng thái hiện tại (" + order.getStatus() + ").");
        }

        if (order.getType() != OrderType.PACKAGE_PURCHASE) {
            throw new IllegalStateException("Chỉ có thể thanh toán đơn hàng mua gói bằng số dư.");
        }

        Long totalAmountNeeded = order.getTotal();
        Long currentMainBalance = user.getMainBalance();
        Long currentBonusBalance = user.getBonusBalance();
        Long totalAvailableBalance = currentMainBalance + currentBonusBalance;

        log.info("Order {} cần thanh toán: {}. Số dư hiện có: Main={}, Bonus={}, Tổng={}",
                orderId, totalAmountNeeded, currentMainBalance, currentBonusBalance, totalAvailableBalance);

        if (totalAvailableBalance < totalAmountNeeded) {
            throw new InsufficientBalanceException("Số dư tài khoản không đủ. Cần " + totalAmountNeeded + ", còn thiếu " + (totalAmountNeeded - totalAvailableBalance));
        }

        Long bonusDeducted = Math.min(totalAmountNeeded, currentBonusBalance);
        Long mainDeducted = totalAmountNeeded - bonusDeducted;

        user.setBonusBalance(currentBonusBalance - bonusDeducted);
        user.setMainBalance(currentMainBalance - mainDeducted);
        userRepository.save(user);

        log.info("Đã trừ tiền cho order {}: Bonus={}, Main={}. Số dư mới: Main={}, Bonus={}",
                orderId, bonusDeducted, mainDeducted, user.getMainBalance(), user.getBonusBalance());

        order.setStatus(OrderStatus.PAID);
        order.setMethod(PaymentMethod.BALANCE); // Gán phương thức thanh toán
        OrderEntity savedOrder = orderRepository.save(order);

        log.info("Đã cập nhật orderId={} thành PAID (thanh toán bằng số dư)", order.getId());

        // Cộng vật phẩm vào kho
        try {
            for (OrderItemEntity orderItem : order.getItems()) { // Cần lấy items nếu chưa load (lazy)
                creditItemsFromOrderItem(user, orderItem);
            }
            log.info("Đã cộng vật phẩm thành công cho orderId={} (thanh toán bằng số dư)", orderId);
        } catch(Exception e) {
            log.error("!!! Lỗi khi cộng vật phẩm cho orderId={} (thanh toán bằng số dư). Lỗi: {}", orderId, e.getMessage());
            // Xem xét rollback hoặc ghi nhận lỗi
        }

        // Tạo Transaction ghi nhận
        try {
            TransactionEntity transaction = TransactionEntity.builder()
                    .order(savedOrder)
                    .amount(totalAmountNeeded)
                    .status(TransactionStatus.SUCCEEDED)
                    .type(TransactionType.PACKAGE_PURCHASE)
                    .reason("Thanh toán bằng số dư (Bonus: " + bonusDeducted + ", Main: " + mainDeducted + ")")
                    .build();
            transactionRepository.save(transaction);
            log.info("Đã tạo transaction SUCCEEDED (type=PACKAGE_PURCHASE) cho orderId={} (thanh toán bằng số dư)", order.getId());
        } catch(Exception e) {
            log.error("!!! Lỗi khi tạo transaction cho orderId={} (thanh toán bằng số dư). Lỗi: {}", orderId, e.getMessage());
        }

        // Gửi Notification
        try {
            notificationService.createNotification(
                    user,
                    NotificationType.PACKAGE_PURCHASED, // Sử dụng lại type này hoặc tạo type mới
                    "Thanh toán thành công bằng số dư cho đơn hàng #" + savedOrder.getId() + ". Gói tin đã được cộng vào tài khoản.",
                    "/dashboard/transactions?order_id=" + savedOrder.getId()
            );
            log.info("Đã gửi notification thành công cho orderId={} (thanh toán bằng số dư)", order.getId());
        } catch(Exception e) {
            log.error("!!! Lỗi khi gửi notification cho orderId={} (thanh toán bằng số dư). Lỗi: {}", orderId, e.getMessage());
        }

        log.info("--- Kết thúc PAY WITH BALANCE thành công cho orderId={} ---", orderId);

        // Trả về DTO của đơn hàng đã cập nhật
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(savedOrder.getId());
        return orderConverter.toDto(savedOrder, items);
    }

}

