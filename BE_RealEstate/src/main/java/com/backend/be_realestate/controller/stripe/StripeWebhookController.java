package com.backend.be_realestate.controller.stripe;



import com.backend.be_realestate.service.OrderService;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.net.StripeResponseGetter;
import com.stripe.param.*;
import com.stripe.model.EventDataObjectDeserializer;
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
            log.info("Stripe webhook: type={}, id={}", event.getType(), event.getId());

            if ("payment_intent.succeeded".equals(event.getType())) {
                String orderIdStr = null;
                String piId = null;
                Long amount = null;
                Long received = null;

                // Cách 1: cố gắng deserialize ra PaymentIntent
                EventDataObjectDeserializer des = event.getDataObjectDeserializer();
                StripeObject obj = des.getObject().orElse(null);
                if (obj instanceof PaymentIntent pi) {
                    piId = pi.getId();
                    orderIdStr = pi.getMetadata() != null ? pi.getMetadata().get("orderId") : null;
                    amount = pi.getAmount();
                    received = pi.getAmountReceived();
                } else {
                    // Cách 2: Fallback đọc từ raw JSON trong payload
                    JsonObject root = JsonParser.parseString(payload).getAsJsonObject();
                    JsonObject data = root.getAsJsonObject("data");
                    if (data != null && data.has("object")) {
                        JsonObject o = data.getAsJsonObject("object");
                        if (o.has("id") && !o.get("id").isJsonNull()) piId = o.get("id").getAsString();
                        if (o.has("amount") && !o.get("amount").isJsonNull()) amount = o.get("amount").getAsLong();
                        if (o.has("amount_received") && !o.get("amount_received").isJsonNull()) received = o.get("amount_received").getAsLong();
                        if (o.has("metadata") && o.get("metadata").isJsonObject()) {
                            JsonObject md = o.getAsJsonObject("metadata");
                            if (md.has("orderId") && !md.get("orderId").isJsonNull()) {
                                orderIdStr = md.get("orderId").getAsString();
                            }
                        }
                    }
                }

                log.info("PI id={}, orderId={}, amount={}, received={}", piId, orderIdStr, amount, received);

                if (orderIdStr == null) {
                    log.warn("Missing metadata.orderId for event {}", event.getId());
                    return ResponseEntity.ok("no orderId");
                }

                Long orderId = Long.valueOf(orderIdStr);
                // Fulfill ngay (nếu muốn đối chiếu tiền, làm sau khi xác minh luồng ok)
                orderService.processPaidOrder(orderId);
                log.info("✅ Order {} marked PAID via webhook (pi={})", orderId, piId);
            }

            return ResponseEntity.ok("success");
        } catch (SignatureVerificationException e) {
            log.error("Stripe signature invalid", e);
            return ResponseEntity.badRequest().body("invalid signature");
        } catch (Exception e) {
            log.error("Webhook error", e);
            return ResponseEntity.internalServerError().body("webhook error");
        }
    }
}