package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @Query("SELECT o FROM OrderEntity o JOIN FETCH o.user WHERE o.user.userId = :userId ORDER BY o.createdAt DESC")
    List<OrderEntity> findOrdersByUserId(Long userId);


    @Query(value = """
        SELECT COUNT(*) 
        FROM orders o 
        WHERE o.created_at >= :start AND o.created_at < :end 
          AND (:status IS NULL OR o.status = :status)
        """, nativeQuery = true)
    long countOrdersBetween(@Param("start") Instant start,
                            @Param("end") Instant end,
                            @Param("status") String status);

    @Query(value = """
        SELECT COALESCE(SUM(o.total),0) 
        FROM orders o 
        WHERE o.created_at >= :start AND o.created_at < :end 
          AND (:status IS NULL OR o.status = :status)
        """, nativeQuery = true)
    Long sumRevenueBetween(@Param("start") Instant start,
                           @Param("end") Instant end,
                           @Param("status") String status);

    // series theo ngày — timezone VN
    @Query(value = """
        SELECT DATE(CONVERT_TZ(o.created_at,'+00:00', :tz)) AS d, 
               COUNT(*) AS orders, 
               COALESCE(SUM(o.total),0) AS revenue
        FROM orders o
        WHERE o.created_at >= :start AND o.created_at < :end
          AND (:status IS NULL OR o.status = :status)
        GROUP BY d
        ORDER BY d
        """, nativeQuery = true)
    List<Object[]> dailyOrderSeries(@Param("start") Instant start,
                                    @Param("end") Instant end,
                                    @Param("tz") String tz,
                                    @Param("status") String status);

    @Query("""
           SELECT o FROM OrderEntity o
           LEFT JOIN o.user u
           WHERE LOWER(CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')))
                 LIKE LOWER(CONCAT('%', :kw, '%'))
           ORDER BY o.createdAt DESC
           """)
    Page<OrderEntity> findRecentByCustomerName(String kw, Pageable pageable);

    @Query("""
           SELECT o FROM OrderEntity o
           ORDER BY o.createdAt DESC
           """)
    Page<OrderEntity> findRecent(Pageable pageable);
}

