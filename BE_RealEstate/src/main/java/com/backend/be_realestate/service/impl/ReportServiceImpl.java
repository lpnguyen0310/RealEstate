package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.*;
import com.backend.be_realestate.modals.dto.ReportDetailDTO;
import com.backend.be_realestate.modals.request.CreateReportRequest;
import com.backend.be_realestate.enums.NotificationType;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.repository.PropertyAuditRepository;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.ReportRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.NotificationService;
import com.backend.be_realestate.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Tự động tiêm (inject) các trường 'final'
@Slf4j // Dùng để log (ghi lại) các bước
public class ReportServiceImpl implements ReportService {

    // --- CÁC THÀNH PHẦN TIÊM VÀO (DEPENDENCIES) ---

    private final ReportRepository reportRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final PropertyAuditRepository propertyAuditRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy tên của role Admin từ file application.properties
     * (Ví dụ: app.admin.role-name=ROLE_ADMIN)
     * Nếu không có, mặc định là "ROLE_ADMIN".
     */
    @Value("${app.admin.role-name:ADMIN}")
    private String ADMIN_ROLE_NAME;

    // --- HÀM XỬ LÝ CHÍNH ---

    @Override
    @Transactional // BẮT BUỘC: Đảm bảo tất cả cùng thành công hoặc cùng thất bại
    public void createReport(CreateReportRequest request, UserEntity currentUser) {

        log.info("Bắt đầu xử lý báo cáo cho bài đăng ID: {} từ user: {}", request.getPostId(), currentUser.getEmail());

        // 1. TÌM VÀ KHÓA (LOCK) BÀI ĐĂNG
        // Dùng findWithLockById để ngăn chặn race condition
        PropertyEntity property = propertyRepository.findWithLockById(request.getPostId())
                .orElseThrow(() -> {
                    log.error("Không tìm thấy Property với ID: {}", request.getPostId());
                    return new RuntimeException("Property not found with id: " + request.getPostId());
                });

        // 2. TẠO ĐỐI TƯỢNG REPORT
        Report newReport = Report.builder()
                .reporter(currentUser)
                .property(property)
                .details(request.getDetails())
                .reasons(new HashSet<>(request.getReasons()))
                // .status(ReportStatus.PENDING) // Entity Report đã tự gán mặc định
                .build();

        // 3. THÊM ẢNH MINH CHỨNG (NẾU CÓ)
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            request.getImageUrls().forEach(url -> {
                ReportImage reportImage = ReportImage.builder()
                        .imageUrl(url)
                        .build();
                newReport.addImage(reportImage); // Dùng hàm helper để liên kết
            });
        }

        // 4. LƯU REPORT (VÀ ẢNH) XUỐNG DB
        // Do có CascadeType.ALL, ReportImage sẽ được lưu cùng lúc
        Report savedReport = reportRepository.save(newReport);
        log.info("Đã lưu Report mới với ID: {}", savedReport.getId());

        // 5. CẬP NHẬT BIẾN ĐẾM TRÊN BÀI ĐĂNG
        int newCount = property.getReportCount() + 1;
        property.setReportCount(newCount);

        // 6. XỬ LÝ LOGIC "10 BÁO CÁO" (THEO YÊU CẦU MỚI CỦA BẠN)
        // Chỉ đổi trạng thái, không gửi thông báo cho chủ tin.
        if (newCount == 10) {
            property.setStatus(PropertyStatus.PENDING_REVIEW);
            log.warn("Bài đăng ID: {} đã đạt 10 báo cáo. Chuyển sang PENDING_REVIEW.", property.getId());
        }

        // 7. LƯU LẠI BÀI ĐĂNG (ĐỂ CẬP NHẬT reportCount và status)
        propertyRepository.save(property);

        // 8. GỬI THÔNG BÁO CHO ADMIN (LOGIC CỦA BẠN)
        // Gửi thông báo ngay cả khi đây mới là báo cáo đầu tiên
        notifyAdminsOfNewReport(property, currentUser, savedReport);

        try {
            log.info("Đang gửi tín hiệu WS refresh đến /topic/admin/properties");
            messagingTemplate.convertAndSend("/topic/admin/properties", "new_report");
        } catch (Exception e) {
            log.error("Lỗi khi gửi tín hiệu WS refresh admin: {}", e.getMessage());
        }

        log.info("Hoàn tất xử lý báo cáo cho bài đăng ID: {}", property.getId());
    }

    /**
     * Hàm nội bộ dùng để tìm và gửi thông báo (qua WebSocket) cho tất cả Admin.
     */
    private void notifyAdminsOfNewReport(PropertyEntity property, UserEntity reporter, Report report) {

        // 1. Tìm tất cả tài khoản Admin
        List<UserEntity> allAdmins = userRepository.findAllByRoles_Code(ADMIN_ROLE_NAME);

        if (allAdmins.isEmpty()) {
            log.warn("Không tìm thấy Admin nào (với role '{}') để gửi thông báo.", ADMIN_ROLE_NAME);
            return;
        }

        String message = String.format("Bài đăng '%s' vừa nhận được 1 báo cáo mới.", property.getTitle());

        String adminLink = String.format("/admin/posts?reportPostId=%d", property.getId());

        log.info("Chuẩn bị gửi thông báo báo cáo mới cho {} admin...", allAdmins.size());

        // 3. Gửi thông báo cho từng Admin
        for (UserEntity adminUser : allAdmins) {
            notificationService.createNotification(
                    adminUser, // Người nhận là Admin
                    NotificationType.SYSTEM_ANNOUNCEMENT, // (Hoặc bạn tạo type: NEW_REPORT)
                    message,
                    adminLink
            );
        }
    }

    @Override
    @Transactional(readOnly = true) // Dùng readOnly để tăng hiệu năng
    public List<ReportDetailDTO> getReportsForPost(Long postId) {
        log.info("Admin đang lấy chi tiết báo cáo cho bài đăng ID: {}", postId);

        // 1. Kiểm tra xem bài đăng có tồn tại không
        if (!propertyRepository.existsById(postId)) {
            // Bạn có thể muốn dùng exception cụ thể hơn
            throw new RuntimeException("Property not found with id: " + postId);
        }

        // 2. Lấy tất cả báo cáo (dùng hàm mới trong repository)
        List<Report> reports = reportRepository.findByProperty_IdOrderByCreatedAtDesc(postId);

        // 3. Chuyển đổi (Map) sang DTO
        return reports.stream()
                .map(this::mapToReportDetailDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional // (Đã xóa readOnly = true, rất tốt)
    public void sendWarningToPostOwner(Long postId, String message, UserEntity adminUser) {
        log.info("Admin '{}' đang gửi cảnh báo cho bài đăng ID: {}", adminUser.getEmail(), postId);

        PropertyEntity property = propertyRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Property not found with id: " + postId));

        UserEntity postOwner = property.getUser();
        if (postOwner == null) {
            log.error("Không tìm thấy chủ sở hữu của bài đăng ID: {}", postId);
            throw new RuntimeException("Post owner not found");
        }

        // === BẮT ĐẦU SỬA ĐỔI LOGIC ===

        // 1. Tạo Tiêu đề (dưới dạng text)
        String title = "Cảnh báo từ Quản trị viên";

        // 2. Tạo Nội dung (Message)
        // 'message' là nội dung admin nhập (ví dụ: "Sửa lại nội dung phù hợp")
        // 'postTitle' là tiêu đề bài đăng
        String postTitle = property.getTitle();
        String body = String.format("Bài đăng '%s'\nLỗi cảnh báo: %s", postTitle, message);

        // 3. Gộp Title và Body lại bằng ký tự xuống dòng (\n)
        // Frontend sẽ cần hiển thị \n này (ví dụ: dùng CSS 'white-space: pre-line')
        String finalMessage = String.format("%s\n%s", title, body);

        // 4. (Khuyến nghị) Dùng Type (Loại) thông báo riêng
        // Bạn nên tạo 'POST_WARNING' trong Enum NotificationType.java
        NotificationType type = NotificationType.POST_WARNING;
        // Nếu chưa tạo, hãy tạm dùng: NotificationType.SYSTEM_ANNOUNCEMENT;

        // 5. Tạo Link
        String userLink = String.format("/dashboard/posts?tab=warned&warnedPostId=%d", property.getId());

        // 6. Gọi hàm createNotification (vẫn dùng 4 tham số)
        notificationService.createNotification(
                postOwner,
                type,
                finalMessage,   // <<< Dùng message đã được format (có \n)
                userLink
        );

        property.setStatus(PropertyStatus.WARNED);

        property.setLatestWarningMessage(finalMessage);

        PropertyAuditEntity auditLog = PropertyAuditEntity.builder()
                .property(property)
                .actorId(adminUser.getUserId())// UserEntity của Admin
                .type("WARNED")   // Dùng String hoặc Enum
                .message(message) // Lý do admin nhập
                .at(Timestamp.from(Instant.now()))
                .build();
        propertyAuditRepository.save(auditLog);

        propertyRepository.save(property);

        try {
            log.info("Đang gửi tín hiệu WS refresh đến /topic/admin/properties (sau khi gửi cảnh báo)");
            messagingTemplate.convertAndSend("/topic/admin/properties", "warning_sent");
        } catch (Exception e) {
            log.error("Lỗi khi gửi tín hiệu WS refresh admin: {}", e.getMessage());
        }

        // === KẾT THÚC SỬA ĐỔI ===

        log.info("Đã gửi cảnh báo thành công tới user: {}", postOwner.getEmail());
    }

    @Override
    @Transactional // QUAN TRỌNG: Dùng @Transactional (không có readOnly)
    public void dismissReportsForPost(Long postId) {
        log.info("Admin đang bỏ qua (dismiss) báo cáo cho bài đăng ID: {}", postId);

        // 1. TÌM VÀ KHÓA (LOCK) BÀI ĐĂNG (dùng hàm có sẵn của bạn)
        PropertyEntity property = propertyRepository.findWithLockById(postId)
                .orElseThrow(() -> new RuntimeException("Property not found with id: " + postId));

        // 2. LOGIC CHÍNH: Reset bộ đếm báo cáo
        property.setReportCount(0);

        // 3. (Tùy chọn): Bạn cũng có thể xóa các report cũ
        // List<Report> reports = reportRepository.findByProperty_IdOrderByCreatedAtDesc(postId);
        // reportRepository.deleteAll(reports);

        // 4. LƯU LẠI BÀI ĐĂNG
        propertyRepository.save(property);

        log.info("Đã reset reportCount về 0 cho bài đăng ID: {}", postId);
    }

    @Override
    @Transactional
    public void deleteSelectedReports(Long postId, List<Long> reportIds) {
        log.info("Admin đang xóa {} báo cáo đã chọn cho bài đăng ID: {}", reportIds.size(), postId);

        if (reportIds.isEmpty()) {
            log.warn("Không có báo cáo nào được chọn để xóa cho bài đăng ID: {}", postId);
            return;
        }

        // 1. TÌM VÀ KHÓA (LOCK) BÀI ĐĂNG
        PropertyEntity property = propertyRepository.findWithLockById(postId)
                .orElseThrow(() -> new RuntimeException("Property not found with id: " + postId));

        // 2. LOGIC CHÍNH: XÓA CÁC BÁO CÁO ĐƯỢC CHỌN

        // Tạo danh sách các Report Object từ các ID
        List<Report> reportsToDelete = reportRepository.findAllById(reportIds);

        // Kiểm tra xem tất cả report có thuộc về post này không (Phòng thủ)
        reportsToDelete.forEach(report -> {
            if (!report.getProperty().getId().equals(postId)) {
                log.error("Report ID: {} không thuộc về Post ID: {}", report.getId(), postId);
                throw new RuntimeException("Report ID mismatch");
            }
        });

        // Thực hiện xóa (Do có Cascade, các ảnh minh chứng cũng sẽ bị xóa)
        reportRepository.deleteAll(reportsToDelete);
        log.info("Đã xóa thành công {} báo cáo.", reportsToDelete.size());

        // 3. CẬP NHẬT LẠI BIẾN ĐẾM BÁO CÁO (reportCount)
        // Cách 1: Đếm lại (an toàn nhất)
        int remainingReportsCount = reportRepository.countByProperty_Id(postId);

        // Cách 2: Trừ đi số lượng đã xóa (hiệu năng tốt hơn)
        // int remainingReportsCount = property.getReportCount() - reportsToDelete.size();

        property.setReportCount(remainingReportsCount);

        // 4. LƯU LẠI BÀI ĐĂNG (Cập nhật reportCount)
        propertyRepository.save(property);

        log.info("Đã cập nhật reportCount mới ({}) cho bài đăng ID: {}", remainingReportsCount, postId);
    }

    // Hàm helper (hàm nội bộ) để map
    private ReportDetailDTO mapToReportDetailDTO(Report report) {
        return ReportDetailDTO.builder()
                .id(report.getId())
                .reasons(report.getReasons())
                .details(report.getDetails())
                .imageUrls(report.getImages().stream()
                        .map(ReportImage::getImageUrl)
                        .collect(Collectors.toList()))
                .reporterEmail(report.getReporter() != null ? report.getReporter().getEmail() : "N/A")
                .createdAt(report.getCreatedAt())
                .build();
    }
}