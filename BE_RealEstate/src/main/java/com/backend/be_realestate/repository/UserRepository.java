package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

    public interface UserRepository extends JpaRepository<UserEntity,Long> {
        Optional<UserEntity> findByEmail(String email);
        Optional<UserEntity> findByPhone(String phone);
        // tiện dụng: tìm theo email hoặc phone
        default Optional<UserEntity> findByIdentifier(String identifier) {
            if (identifier == null) return Optional.empty();
            return (identifier.contains("@") ? findByEmail(identifier) : findByPhone(identifier));
        }

    }
