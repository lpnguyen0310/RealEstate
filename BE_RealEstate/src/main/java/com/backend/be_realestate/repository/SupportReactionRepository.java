package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SupportReactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportReactionRepository extends JpaRepository<SupportReactionEntity, Long> {
    Optional<SupportReactionEntity> findByMessage_MessageIdAndUser_UserIdAndEmoji(Long messageId, Long userId, String emoji);
    List<SupportReactionEntity> findByMessage_MessageId(Long messageId);
}