package com.backend.be_realestate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
public class BaseEntity {

    @CreatedDate
    @Column(name="created_at", updatable=false)
    private Date createdAt;

    @LastModifiedDate
    @Column(name="updated_at")
    private Date updatedAt;

    @CreatedBy
    @Column(name="created_by", updatable=false, length=100)
    private String createdBy;

    @LastModifiedBy
    @Column(name="updated_by", length=100)
    private String updatedBy;
}
