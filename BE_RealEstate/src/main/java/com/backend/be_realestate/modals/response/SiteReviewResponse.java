package com.backend.be_realestate.modals.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SiteReviewResponse {
    private Long id;
    private String name;         // tên hiển thị
    private int rating;
    private String comment;
    private String createdAt;    // format sẵn "MM/yyyy" hoặc ISO
    private String status;
    private String email;
    private String phone;
}
