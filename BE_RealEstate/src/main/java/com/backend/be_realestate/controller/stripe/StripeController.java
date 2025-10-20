package com.backend.be_realestate.controller.stripe;

import com.backend.be_realestate.entity.OrderEntity;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.repository.OrderRepository;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class StripeController {

    private final OrderRepository orderRepository;

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

            return ResponseEntity.ok(Map.of(
                    "clientSecret", pi.getClientSecret()
            ));

        } catch (Exception e) {
            log.error("Stripe create PI error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
