package com.backend.be_realestate.controller;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.ReportDetailDTO;
import com.backend.be_realestate.modals.request.AdminWarningRequest;
import com.backend.be_realestate.modals.request.CreateReportRequest;
// THÊM IMPORT:
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
// Added missing imports:

import java.security.Principal; // <-- Thêm import này
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    // SỬA 1: Inject UserRepository giống như OrderController
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> createReport(
            @Valid @RequestBody CreateReportRequest request,
            Principal principal
    ) {
        // SỬA 3: Lấy UserEntity từ email (giống hệt logic của OrderController)
        if (principal == null) {
            // Dòng này thực ra sẽ không chạy vì @PreAuthorize sẽ chặn trước
            // nhưng nó là một cách phòng thủ tốt.
            return ResponseEntity.status(401).body("Yêu cầu không được xác thực.");
        }

        String userEmail = principal.getName();
        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        // Logic cũ của bạn giờ sẽ chạy đúng vì currentUser không còn là null
        reportService.createReport(request, currentUser);
        return ResponseEntity.ok("Báo cáo của bạn đã được gửi thành công.");
    }

    @GetMapping("/post/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReportDetailDTO>> getReportsForPost(
            @PathVariable Long postId
    ) {
        List<ReportDetailDTO> reports = reportService.getReportsForPost(postId);
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/warn/post/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> sendWarning(
            @PathVariable Long postId,
            @Valid @RequestBody AdminWarningRequest request,
            Principal principal // Lấy Admin đang thực hiện
    ) {
        // (Bạn có thể lấy UserEntity của admin nếu cần log)
        UserEntity adminUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        reportService.sendWarningToPostOwner(postId, request.getMessage(), adminUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dismiss/post/{postId}")
    @PreAuthorize("hasRole('ADMIN')") // Dùng hasRole như bạn đã sửa
    public ResponseEntity<Void> dismissReports(@PathVariable Long postId) {
        reportService.dismissReportsForPost(postId);
        return ResponseEntity.ok().build(); // Trả về 200 OK
    }
}