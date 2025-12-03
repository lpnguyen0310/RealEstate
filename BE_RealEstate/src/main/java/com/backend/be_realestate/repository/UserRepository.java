package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByPhone(String phone);

    // tiện dụng: tìm theo email hoặc phone
    default Optional<UserEntity> findByIdentifier(String identifier) {
        if (identifier == null) return Optional.empty();
        return (identifier.contains("@") ? findByEmail(identifier) : findByPhone(identifier));
    }

    @Query("SELECT u FROM UserEntity u JOIN u.roles r WHERE r.name = :roleName")
    List<UserEntity> findByRoleName(@Param("roleName") String roleName);

    List<UserEntity> findAllByRoles_Code(String code);

    @Query("""
      SELECT DISTINCT u FROM UserEntity u
      LEFT JOIN u.roles r
      WHERE (:role IS NULL OR r.code = :role)
        AND (:status IS NULL OR (CASE WHEN u.isActive = TRUE THEN 'ACTIVE' ELSE 'LOCKED' END) = :status)
        AND (
             :kw IS NULL OR :kw = '' OR
             LOWER(CONCAT(COALESCE(u.lastName,''),' ',COALESCE(u.firstName,''))) LIKE LOWER(CONCAT('%', :kw, '%')) OR
             LOWER(u.email) LIKE LOWER(CONCAT('%', :kw, '%')) OR
             u.phone LIKE CONCAT('%', :kw, '%')
        )
        AND (
             :requestType IS NULL
             OR (:requestType = 'LOCK_REQUESTED' AND u.lockRequested = TRUE)
             OR (:requestType = 'DELETE_REQUESTED' AND u.deleteRequested = TRUE)
        )
    """)
    Page<UserEntity> searchAdmin(@Param("kw") String kw,
                                 @Param("role") String role,
                                 @Param("status") String status,
                                 @Param("requestType") String requestType,   // 👈 NEW
                                 Pageable pageable);

    @Query(value = """
        SELECT COUNT(*)
        FROM users u
        WHERE u.created_at >= :startUtc AND u.created_at < :endUtc
        """, nativeQuery = true)
    long countNewUsersBetween(@Param("startUtc") Instant startUtc,
                              @Param("endUtc") Instant endUtc);

    @Query(value = """
        SELECT DATE(CONVERT_TZ(u.created_at, '+00:00', :tz)) AS d, COUNT(*) AS c
        FROM users u
        WHERE u.created_at >= :startUtc AND u.created_at < :endUtc
        GROUP BY d
        ORDER BY d
        """, nativeQuery = true)
    List<Object[]> dailyNewUsersSeries(@Param("startUtc") Instant startUtc,
                                       @Param("endUtc") Instant endUtc,
                                       @Param("tz") String tz);
}
