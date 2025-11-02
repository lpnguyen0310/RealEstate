package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.ReactionDto;
import com.backend.be_realestate.modals.request.CreateConversationRequest;
import com.backend.be_realestate.modals.request.SendMessageRequest;
import com.backend.be_realestate.modals.response.ConversationSummaryResponse;
import com.backend.be_realestate.modals.response.MessageResponse;
import com.backend.be_realestate.service.ISupportReactionService;
import com.backend.be_realestate.service.ISupportService;
import com.backend.be_realestate.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final ISupportService supportService;
    private final SecurityUtils securityUtils;
    private final ISupportReactionService reactionService;

    /**
     * Khách (hoặc user đã đăng nhập) tạo cuộc trò chuyện mới.
     * Cho phép user chưa đăng nhập: userId sẽ null → lưu thông tin guest trong request.
     */
    @PostMapping("/conversations")
    public ResponseEntity<ConversationSummaryResponse> createConversation(
            Authentication auth,
            @RequestBody CreateConversationRequest req
    ) {
        Long userId = null;
        try {
            userId = securityUtils.currentUserId(auth);
        } catch (Exception ignored) { /* guest */ }

        ConversationSummaryResponse res = supportService.createConversation(userId, req);
        return ResponseEntity.ok(res);
    }


    @GetMapping("/conversations")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public Page<ConversationSummaryResponse> list(
            Authentication auth,
            @RequestParam(defaultValue = "all") String tab,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        Long meId = securityUtils.currentUserId(auth);
        Pageable pageable = PageRequest.of(page, size);
        return supportService.list(tab, meId, q, pageable);
    }

    /**
     * Lấy lịch sử tin nhắn của 1 hội thoại.
     * Rule mặc định: ADMIN/AGENT được xem; nếu muốn cho customer xem, bổ sung rule kiểm tra owner.
     */
    @GetMapping("/messages")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    public Page<MessageResponse> messages(
            @RequestParam Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return supportService.messages(conversationId, pageable);
    }

    /**
     * Gửi tin nhắn (cả phía ADMIN/AGENT & CUSTOMER).
     * role sẽ được xác định theo quyền hiện tại.
     */
    @PostMapping("/messages")
    public MessageResponse send(Authentication auth, @RequestBody SendMessageRequest req) {
        Long userId = null;
        try {
            userId = securityUtils.currentUserId(auth);
        } catch (Exception ignored) { /* guest */ }

        String role = securityUtils.hasAnyRole(auth, "ADMIN") ? "ADMIN" : "USER";
        return supportService.send(userId, role, req);
    }

    /**
     * ADMIN/AGENT nhận xử lý 1 cuộc trò chuyện (assign về mình).
     */
    @PostMapping("/conversations/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    public ConversationSummaryResponse assignToMe(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long meId = securityUtils.currentUserId(auth);
        return supportService.assignToMe(id, meId);
    }

    /**
     * Đánh dấu đã đọc (đơn giản).
     * who = ADMIN | CUSTOMER
     */
    @PostMapping("/read-receipts")
    public ResponseEntity<Void> markRead(
            @RequestParam Long conversationId,
            @RequestParam String who
    ) {
        supportService.markRead(conversationId, who);
        return ResponseEntity.ok().build();
    }


    // SupportController.java
    @DeleteMapping("/conversations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteOne(@PathVariable Long id) {
        supportService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reactions/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT','USER')")
    public ResponseEntity<List<ReactionDto>> toggleReaction(
            Authentication auth,
            @RequestParam Long messageId,
            @RequestParam String emoji
    ) {
        Long userId = securityUtils.currentUserId(auth);
        var list = reactionService.toggle(userId, messageId, emoji);
        return ResponseEntity.ok(list);
    }
}