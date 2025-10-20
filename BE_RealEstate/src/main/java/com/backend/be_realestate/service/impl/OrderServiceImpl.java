package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.OrderConverter;
import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.enums.ItemType;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.dto.order.OrderItemDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.repository.*;
import com.backend.be_realestate.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
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

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ListingPackageRepository listingPackageRepository;
    private final OrderConverter orderConverter;
    private final ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private final UserInventoryRepository inventoryRepository;

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
    @Transactional
    public void processPaidOrder(Long orderId) {
        // 1. Tải đơn hàng từ DB
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với ID: " + orderId));

        // Kiểm tra để đảm bảo chúng ta không xử lý lại đơn hàng đã thanh toán
        if (order.getStatus() == OrderStatus.PAID) {
            System.out.println("Đơn hàng " + orderId + " đã được xử lý trước đó.");
            return;
        }

        // 2. Cập nhật trạng thái đơn hàng thành PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // 3. Lấy thông tin người dùng từ đơn hàng
        UserEntity user = order.getUser();

        // 4. Lặp qua các sản phẩm trong đơn hàng để cộng vào kho
        for (OrderItemEntity orderItem : order.getItems()) {
            creditItemsFromOrderItem(user, orderItem);
        }

        System.out.println("Đã xử lý thành công đơn hàng " + orderId + " và cộng vật phẩm cho người dùng " + user.getEmail());
    }

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
}
