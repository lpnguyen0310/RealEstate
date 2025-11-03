package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {

    // ID của bài đăng bị báo cáo
    @NotNull(message = "Post ID is required")
    private Long postId;

    // Danh sách lý do (["ADDRESS", "FAKE"])
    private List<String> reasons;

    // Nội dung "Phản hồi khác"
    private String details;

    // Danh sách URL ảnh minh chứng
    private List<String> imageUrls;
}
