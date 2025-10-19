package com.backend.be_realestate.controller.stripe;


import com.backend.be_realestate.entity.OrderEntity;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.repository.OrderRepository;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class StripeController {

    private final OrderRepository orderRepository;

    @PostMapping("/orders/{orderId}/pay")
    public ResponseEntity<?> createPaymentIntent(@PathVariable Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order không tồn tại: " + orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order đã thanh toán"));
        }

        try {
            // Stripe tự chống tạo trùng nếu bạn set IdempotencyKey
            com.stripe.net.RequestOptions options = com.stripe.net.RequestOptions.builder()
                    .setIdempotencyKey("order-" + orderId) // Stripe sẽ trả về PI cũ nếu request trùng
                    .build();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(order.getTotal())   // đơn vị: đồng (VND)
                    .setCurrency("vnd")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true).build()
                    )
                    .putMetadata("orderId", String.valueOf(orderId)) // webhook map lại order
                    .build();

            PaymentIntent pi = PaymentIntent.create(params, options);

            return ResponseEntity.ok(Map.of(
                    "clientSecret", pi.getClientSecret(),
                    "paymentIntentId", pi.getId()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
