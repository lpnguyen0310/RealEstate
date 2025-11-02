package com.backend.be_realestate.modals.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Long id;
    private String fullName;      // first + last
    private String email;
    private String phone;
    private String role;          // rút gọn: 1 role đại diện (hoặc cao nhất)
    private String status;        // "ACTIVE" | "LOCKED" (từ isActive)
    private Integer postsCount;   // tạm thời 0 nếu chưa có
    private Instant createdAt;    // từ BaseEntity.getCreatedAt()
    private String address;       // tạm thời null / ""
    private Boolean deleteRequested;
    private Boolean lockRequested;
}   