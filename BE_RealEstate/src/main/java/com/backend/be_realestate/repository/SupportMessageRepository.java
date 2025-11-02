package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SupportConversationEntity;
import com.backend.be_realestate.entity.SupportMessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessageEntity, Long> {

    // Service bạn đang gọi:
    Page<SupportMessageEntity> findByConversationOrderByCreatedAtAsc(
            SupportConversationEntity conversation, Pageable pageable);

    // (tuỳ chọn) lấy tin cuối để build preview
    Optional<SupportMessageEntity> findTop1ByConversationOrderByCreatedAtDesc(
            SupportConversationEntity conversation);

    // (tuỳ chọn) fetch luôn attachments để tránh N+1
    @Query("select m from SupportMessageEntity m where m.conversation = :c order by m.createdAt asc")
    Page<SupportMessageEntity> findPageWithAttachments(@Param("c") SupportConversationEntity conversation,
                                                       Pageable pageable);
}