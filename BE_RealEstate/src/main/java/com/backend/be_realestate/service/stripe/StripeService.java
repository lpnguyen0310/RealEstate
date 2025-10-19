package com.backend.be_realestate.service.stripe;

import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.currency:vnd}")
    private String currency;

    public Map<String, Object> createPaymentIntent(Long amount, String orderId) throws Exception {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)           // VND = đơn vị "đồng"
                .setCurrency(currency)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true).build()
                )
                .putMetadata("orderId", String.valueOf(orderId))
                .build();

        PaymentIntent pi = PaymentIntent.create(params);
        Map<String, Object> res = new HashMap<>();
        res.put("clientSecret", pi.getClientSecret());
        res.put("paymentIntentId", pi.getId());
        return res;
    }
}