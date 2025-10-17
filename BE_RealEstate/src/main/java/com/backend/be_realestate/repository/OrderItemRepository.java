// src/main/java/com/backend/be_realestate/repo/OrderItemRepository.java
package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
    List<OrderItemEntity> findByOrderId(Long orderId);
}
