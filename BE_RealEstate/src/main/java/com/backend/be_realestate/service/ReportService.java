package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.ReportDetailDTO;
import com.backend.be_realestate.modals.request.CreateReportRequest;
import com.backend.be_realestate.entity.UserEntity;

import java.util.List;

public interface ReportService {

    /**
     * Xử lý nghiệp vụ tạo một báo cáo mới,
     * cập nhật số đếm của bài đăng, và kiểm tra logic 10 báo cáo.
     *
     * @param request DTO chứa thông tin báo cáo từ client
     * @param currentUser UserEntity của người gửi báo cáo
     */
    void createReport(CreateReportRequest request, UserEntity currentUser);
    List<ReportDetailDTO> getReportsForPost(Long postId);
    void sendWarningToPostOwner(Long postId, String message, UserEntity adminUser);
    void dismissReportsForPost(Long postId);
}