package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventoryEntity, Long> {
    Optional<UserInventoryEntity> findByUserAndItemType(UserEntity user, String itemType);

    List<UserInventoryEntity> findAllByUser(UserEntity user);
}