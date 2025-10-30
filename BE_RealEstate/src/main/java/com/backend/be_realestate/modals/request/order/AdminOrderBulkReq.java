// src/main/java/com/backend/be_realestate/modals/request/order/AdminOrderBulkReq.java

package com.backend.be_realestate.modals.request.order;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data // Tự động tạo getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderBulkReq {
    private List<Long> ids;
    private String action;
}