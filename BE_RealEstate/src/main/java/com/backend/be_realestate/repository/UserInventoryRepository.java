package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventoryEntity, Long> {
    Optional<UserInventoryEntity> findByUserAndItemType(UserEntity user, String itemType);
    Optional<UserInventoryEntity> findByUser_UserIdAndItemType(Long userId, String itemType);

    List<UserInventoryEntity> findAllByUser(UserEntity user);
    @Query("select i from UserInventoryEntity i where i.user.userId=:uid and i.itemType=:type")
    Optional<UserInventoryEntity> lockByUserAndType(@Param("uid") Long uid, @Param("type") String type);
}