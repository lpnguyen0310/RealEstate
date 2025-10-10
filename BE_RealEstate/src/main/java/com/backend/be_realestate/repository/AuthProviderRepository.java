package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.AuthProviderEntity;
import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthProviderRepository extends JpaRepository<AuthProviderEntity, Long> {
    Optional<AuthProviderEntity> findByUser(UserEntity user);
    Optional<AuthProviderEntity> findByProviderUID(String providerUID);
}
