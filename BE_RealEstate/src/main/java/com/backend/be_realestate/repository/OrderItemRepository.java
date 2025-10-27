// src/main/java/com/backend/be_realestate/repo/OrderItemRepository.java
package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.OrderItemEntity;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.transactions.RecentTransactionDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
    List<OrderItemEntity> findByOrderId(Long orderId);

    @Query("""
       select new com.backend.be_realestate.modals.dto.transactions.RecentTransactionDTO(
         oi.id, o.id, u.userId,
         concat(coalesce(u.lastName,''),' ',coalesce(u.firstName,'')) ,
         u.email, oi.title, oi.lineTotal, o.createdAt
       )
       from OrderItemEntity oi
         join oi.order o
         join o.user u
       where o.status in :statuses
       order by o.createdAt desc
    """)
    List<RecentTransactionDTO> findRecentTransactions(
            @Param("statuses") List<OrderStatus> statuses,
            Pageable pageable
    );
}
