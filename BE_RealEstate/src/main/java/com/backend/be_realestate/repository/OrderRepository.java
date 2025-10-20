package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.OrderEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @Query("SELECT o FROM OrderEntity o JOIN FETCH o.user WHERE o.user.userId = :userId ORDER BY o.createdAt DESC")
    List<OrderEntity> findOrdersByUserId(Long userId);
}

