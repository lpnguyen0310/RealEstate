package com.backend.be_realestate.modals.dto.propertydashboard;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class PendingPropertyDTO {
    private Long id;
    private String title;
    private String author;     // Họ tên gộp
    private String postedDate;
}
