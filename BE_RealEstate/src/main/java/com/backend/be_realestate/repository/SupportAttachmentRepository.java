package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SupportAttachmentEntity;
import com.backend.be_realestate.entity.SupportMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportAttachmentRepository extends JpaRepository<SupportAttachmentEntity, Long> {
    List<SupportAttachmentEntity> findByMessage(SupportMessageEntity message);
}