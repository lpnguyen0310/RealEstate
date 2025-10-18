package com.backend.be_realestate.controller;

import com.backend.be_realestate.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin") // Endpoint dành riêng cho admin
public class AdminController {

    @Autowired
    private OrderService orderService;

    // Endpoint này chỉ bạn hoặc admin mới biết để dùng cho việc test
    @PostMapping("/orders/{id}/process-payment")
    public String triggerProcessPaidOrder(@PathVariable Long id) {
        orderService.processPaidOrder(id);
        return "Processed order " + id;
    }
}
