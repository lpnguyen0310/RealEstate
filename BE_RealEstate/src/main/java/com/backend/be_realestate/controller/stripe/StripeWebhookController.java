package com.backend.be_realestate.controller.stripe;

import com.backend.be_realestate.service.OrderService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent; // Chỉ cần import PaymentIntent
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class StripeWebhookController {

    @Value("${stripe.webhook-secret}")
    private String endpointSecret;

    private final OrderService orderService;

    @PostMapping("/webhook")
    public ResponseEntity<String> handle(@RequestHeader("Stripe-Signature") String sig,
                                         @RequestBody String payload) {
        try {
            Event event = Webhook.constructEvent(payload, sig, endpointSecret);
            log.info("Stripe webhook received: type={}, id={}", event.getType(), event.getId());

            if ("payment_intent.succeeded".equals(event.getType())) {

                // ==========================================================
                // THAY ĐỔI QUAN TRỌNG NHẤT Ở ĐÂY
                // Thay vì cố gắng deserialize tự động, chúng ta lấy trực tiếp
                // đối tượng PaymentIntent từ dữ liệu của sự kiện.
                // ==========================================================
                PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();

                log.info("Successfully retrieved PaymentIntent object with id={}", paymentIntent.getId());

                // Gọi service để hoàn tất đơn hàng
                orderService.fulfillOrder(paymentIntent);

            }

            return ResponseEntity.ok("success");
        } catch (SignatureVerificationException e) {
            log.error("!!! Stripe signature invalid", e);
            return ResponseEntity.badRequest().body("invalid signature");
        } catch (Exception e) {
            log.error("!!! Webhook error", e);
            return ResponseEntity.internalServerError().body("webhook error");
        }
    }
}