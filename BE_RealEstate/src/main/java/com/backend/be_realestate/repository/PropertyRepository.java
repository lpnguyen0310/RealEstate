package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.modals.dto.PropertyDTO;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<PropertyEntity,Long>, JpaSpecificationExecutor<PropertyEntity> {
    @Query("SELECT p FROM PropertyEntity p " +
            "LEFT JOIN FETCH p.images " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.ward " +
            "LEFT JOIN FETCH p.district " +
            "LEFT JOIN FETCH p.city " +
            "WHERE p.id = :id")
    Optional<PropertyEntity> findByIdWithDetails(@Param("id") Long id);

    Page<PropertyEntity> findAllByUser_UserId(Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PropertyEntity p where p.id = :id")
    Optional<PropertyEntity> lockById(@Param("id") Long id);

    // UserInventoryRepository.java

    @Query("SELECT p.status as status, COUNT(p.id) as count FROM PropertyEntity p WHERE p.user.userId = :userId GROUP BY p.status")
    List<IPropertyCount> countByStatus(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE PropertyEntity p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int bumpView(@Param("id") Long id);

    int countByUser_UserId(Long userId);

    @Query("""
           select p
           from PropertyEntity p
           where p.status = com.backend.be_realestate.enums.PropertyStatus.PUBLISHED
             and p.listingType in (com.backend.be_realestate.enums.ListingType.VIP, com.backend.be_realestate.enums.ListingType.PREMIUM)
           order by p.postedAt desc
           """)
    List<PropertyEntity> findPopular(Pageable pageable);

    @Query(value = """
        SELECT COUNT(*)
        FROM properties p
        WHERE p.posted_at >= :start AND p.posted_at < :end
          AND (:status IS NULL OR p.status = :status)
        """, nativeQuery = true)
    long countPostedBetween(@Param("start") Instant start,
                            @Param("end") Instant end,
                            @Param("status") String status);

    // Series theo ngày (theo VN timezone)
    @Query(value = """
        SELECT DATE(CONVERT_TZ(p.posted_at,'+00:00', :tz)) AS d,
               COUNT(*) AS c
        FROM properties p
        WHERE p.posted_at >= :start AND p.posted_at < :end
          AND (:status IS NULL OR p.status = :status)
        GROUP BY d
        ORDER BY d
        """, nativeQuery = true)
    List<Object[]> dailyPostedSeries(@Param("start") Instant start,
                                     @Param("end") Instant end,
                                     @Param("tz") String tz,
                                     @Param("status") String status);

    // Số tin đang chờ duyệt (toàn cục hoặc theo pendingStatus)
    @Query(value = """
        SELECT COUNT(*) FROM properties p
        WHERE (:pendingStatus IS NULL OR p.status = :pendingStatus)
        """, nativeQuery = true)
    long countPending(@Param("pendingStatus") String pendingStatus);

    @Query("SELECT p.viewCount FROM PropertyEntity p WHERE p.id = :id")
    Optional<Long> findViewCountById(@Param("id") Long id);


    interface PendingPropertyRow {
        Long getId();
        String getTitle();
        String getAuthor();     // CONCAT firstName + ' ' + lastName
        java.sql.Timestamp getPostedAt();
    }

    @Query("""
        SELECT p.id AS id,
               p.title AS title,
               CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) AS author,
               p.postedAt AS postedAt
        FROM PropertyEntity p
        JOIN p.user u
        WHERE p.status = :status
          AND (
               :q IS NULL
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
          )
        ORDER BY p.postedAt DESC
    """)
    Page<PendingPropertyRow> findPending(
            @Param("status") PropertyStatus status,
            @Param("q") String q,
            Pageable pageable
    );


    @Query("select p from PropertyEntity p where p.id = :id")
    Optional<PropertyEntity> findDetailForEdit(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PropertyEntity> findWithLockById(Long id);
}







