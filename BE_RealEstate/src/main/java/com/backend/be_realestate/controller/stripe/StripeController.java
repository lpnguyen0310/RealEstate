package com.backend.be_realestate.controller.stripe;

import com.backend.be_realestate.entity.OrderEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.request.order.TopUpRequest;
import com.backend.be_realestate.repository.OrderRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.impl.OrderServiceImpl;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class StripeController {

    private final OrderRepository orderRepository;
    private final OrderServiceImpl orderService;
    private final UserRepository userRepository;

    // Bật cái này nếu VND của bạn không render card khi dùng APM tự động
    private static final boolean FORCE_CARD_ONLY = true;

    @PostMapping(value = "/orders/{orderId}/pay", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createPaymentIntent(@PathVariable Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order không tồn tại: " + orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            // FE sẽ hiển thị modal thành công và quay lại
            return ResponseEntity.ok(Map.of("alreadyPaid", true));
        }

        try {
            // Stripe chống trùng bằng Idempotency-Key: nếu FE gọi 2 lần sẽ trả về cùng 1 PI
            com.stripe.net.RequestOptions opts = com.stripe.net.RequestOptions.builder()
                    .setIdempotencyKey("order-" + orderId)
                    .build();

            PaymentIntentCreateParams.Builder b = PaymentIntentCreateParams.builder()
                    // VND là zero-decimal: tổng tính theo "đồng"
                    .setAmount(order.getTotal())
                    .setCurrency("vnd")
                    .putMetadata("orderId", String.valueOf(orderId));

            if (FORCE_CARD_ONLY) {
                // Ép chỉ dùng thẻ -> Payment Element sẽ render form card
                b.addPaymentMethodType("card");
            } else {
                // Hoặc để Stripe tự chọn (cần account hỗ trợ PM cho VND)
                b.setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true).build()
                );
            }

            PaymentIntent pi = PaymentIntent.create(b.build(), opts);

            orderService.createPendingTransaction(order, pi);

            return ResponseEntity.ok(Map.of(
                    "clientSecret", pi.getClientSecret()
            ));

        } catch (Exception e) {
            log.error("Stripe create PI error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/top-up/create-intent", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createTopUpPaymentIntent(@RequestBody @Valid TopUpRequest topUpRequest) {

        // 1. Lấy user đang đăng nhập
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        try {
            // 2. TẠO MỘT ĐƠN HÀNG "NẠP TIỀN"
            // (Chúng ta đã thêm hàm này vào OrderService)
            OrderEntity topUpOrder = orderService.createTopUpOrder(currentUser, topUpRequest.getAmount());

            // 3. TẠO PAYMENT INTENT TỪ ĐƠN HÀNG NÀY
            // (Phần code này giống hệt API cũ)
            com.stripe.net.RequestOptions opts = com.stripe.net.RequestOptions.builder()
                    .setIdempotencyKey("topup-" + topUpOrder.getId()) // Dùng key khác để tránh trùng
                    .build();

            PaymentIntentCreateParams.Builder b = PaymentIntentCreateParams.builder()
                    .setAmount(topUpOrder.getTotal()) // Lấy tổng tiền từ order
                    .setCurrency("vnd")
                    .putMetadata("orderId", String.valueOf(topUpOrder.getId()));

            if (FORCE_CARD_ONLY) {
                b.addPaymentMethodType("card");
            } else {
                b.setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true).build()
                );
            }

            PaymentIntent pi = PaymentIntent.create(b.build(), opts);

            // 4. TẠO GIAO DỊCH PENDING
            // (Hàm này đã được sửa để xử lý loại TOP_UP)
            orderService.createPendingTransaction(topUpOrder, pi);

            // 5. Trả clientSecret về cho FE
            return ResponseEntity.ok(Map.of(
                    "clientSecret", pi.getClientSecret()
            ));

        } catch (Exception e) {
            log.error("Stripe create Top-Up PI error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
