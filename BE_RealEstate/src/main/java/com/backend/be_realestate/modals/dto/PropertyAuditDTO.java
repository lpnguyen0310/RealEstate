package com.backend.be_realestate.modals.dto;

import lombok.*;

import java.sql.Timestamp;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyAuditDTO {
    private Long id;
    private String type;      // APPROVED / REJECTED / ...
    private String message;   // lý do, ghi chú
    private Long actorId;     // ai thực hiện
    private Timestamp at;     // thời điểm
    private String by;        // tuỳ chọn: tên hiển thị
}