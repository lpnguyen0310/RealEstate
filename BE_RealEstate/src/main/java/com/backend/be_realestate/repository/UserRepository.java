package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

    public interface UserRepository extends JpaRepository<UserEntity,Long> {
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
    """)
        Page<UserEntity> searchAdmin(@Param("kw") String kw,
                                     @Param("role") String role,
                                     @Param("status") String status,
                                     Pageable pageable);
    }
