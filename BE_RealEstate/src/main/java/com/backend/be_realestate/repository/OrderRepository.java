package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {}

