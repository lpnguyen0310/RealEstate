package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SupportConversationEntity;
import com.backend.be_realestate.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportConversationRepository
        extends JpaRepository<SupportConversationEntity, Long>,
        JpaSpecificationExecutor<SupportConversationEntity> {

    // tab = "unassigned"
    Page<SupportConversationEntity> findByStatusOrderByLastMessageAtDesc(
            String status, Pageable pageable);

    // tab = "mine"  (assignee != null & status != RESOLVED)
    Page<SupportConversationEntity> findByAssigneeAndStatusNotOrderByLastMessageAtDesc(
            UserEntity assignee, String status, Pageable pageable);

    // tab = "all"
    Page<SupportConversationEntity> findAllByOrderByLastMessageAtDesc(Pageable pageable);

    // (tuỳ chọn) reset unread nhanh bằng update query
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update SupportConversationEntity c set c.unreadForAssignee = 0 where c.conversationId = :id")
    int resetUnreadForAssignee(@Param("id") Long conversationId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update SupportConversationEntity c set c.unreadForCustomer = 0 where c.conversationId = :id")
    int resetUnreadForCustomer(@Param("id") Long conversationId);
}