package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.SupportAttachmentEntity;
import com.backend.be_realestate.entity.SupportConversationEntity;
import com.backend.be_realestate.entity.SupportMessageEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.WsEvent;
import com.backend.be_realestate.modals.dto.AttachmentDto;
import com.backend.be_realestate.modals.dto.ReactionDto;
import com.backend.be_realestate.modals.request.CreateConversationRequest;
import com.backend.be_realestate.modals.request.SendMessageRequest;
import com.backend.be_realestate.modals.response.ConversationSummaryResponse;
import com.backend.be_realestate.modals.response.MessageResponse;
import com.backend.be_realestate.repository.SupportConversationRepository;
import com.backend.be_realestate.repository.SupportMessageRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.ISupportService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportServiceImpl implements ISupportService {

    private final SupportConversationRepository convRepo;
    private final SupportMessageRepository msgRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate ws;

    /* ====== Mappers ====== */
    private ConversationSummaryResponse toSummary(SupportConversationEntity c) {
        String name  = c.getCustomer()!=null ? (c.getCustomer().getLastName() + " " + c.getCustomer().getFirstName()).trim() : c.getGuestName();
        String phone = c.getCustomer()!=null ? c.getCustomer().getPhone() : c.getGuestPhone();
        String email = c.getCustomer()!=null ? c.getCustomer().getEmail() : c.getGuestEmail();
        return ConversationSummaryResponse.builder()
                .conversationId(c.getConversationId())
                .status(c.getStatus())
                .customerName(name)
                .customerPhone(phone)
                .customerEmail(email)
                .subject(c.getSubject())
                .lastMessagePreview(c.getLastMessagePreview())
                .lastMessageAt(c.getLastMessageAt())
                .assigneeId(c.getAssignee() != null ? c.getAssignee().getUserId() : null)
                .unreadForAssignee(Optional.ofNullable(c.getUnreadForAssignee()).orElse(0))
                .unreadForCustomer(Optional.ofNullable(c.getUnreadForCustomer()).orElse(0))
                .build();
    }

    private MessageResponse toMsg(SupportMessageEntity m) {
        List<AttachmentDto> atts = m.getAttachments().stream()
                .map(a -> AttachmentDto.builder()
                        .url(a.getUrl())
                        .name(a.getName())
                        .mimeType(a.getMimeType())
                        .sizeBytes(a.getSizeBytes())// nếu bạn thêm cột
                        .build())
                .collect(Collectors.toList());
        Long senderId = (m.getSender() != null) ? m.getSender().getUserId() : null;
        List<ReactionDto> reacts = m.getReactions().stream()
                .map(r -> ReactionDto.builder()
                        .userId(r.getUser().getUserId())
                        .emoji(r.getEmoji())
                        .build())
                .collect(Collectors.toList());

        return MessageResponse.builder()
                .messageId(m.getMessageId())
                .conversationId(m.getConversation().getConversationId())
                .senderId(senderId)
                .senderRole(m.getSenderRole())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .attachments(atts)
                .reactions(reacts)
                .build();
    }

    private static String preview(String s) {
        if (s == null) return "";
        s = s.strip();
        return s.length() > 140 ? s.substring(0, 140) + "…" : s;
    }
    public class SupportConversationSpecs {
        public static Specification<SupportConversationEntity> textLike(String q) {
            if (q == null || q.isBlank()) return null;
            String like = "%" + q.trim().toLowerCase() + "%";
            return (root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("subject")), like),
                    cb.like(cb.lower(root.get("guestName")), like),
                    cb.like(cb.lower(root.get("guestPhone")), like),
                    cb.like(cb.lower(root.get("guestEmail")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("firstName")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("lastName")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("phone")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("email")), like)
            );
        }
    }
    @Override
    public ConversationSummaryResponse createConversation(Long customerId, CreateConversationRequest req) {
        UserEntity customer = null;
        if (customerId != null) {
            customer = userRepo.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid customerId"));
        }
        SupportConversationEntity cv = SupportConversationEntity.builder()
                .customer(customer)
                .status("UNASSIGNED")
                .subject(req.getSubject())
                .guestName(req.getGuestName())
                .guestPhone(req.getGuestPhone())
                .guestEmail(req.getGuestEmail())
                .lastMessageAt(Instant.now())
                .unreadForAssignee(0)
                .unreadForCustomer(0)
                .build();
        cv = convRepo.save(cv);

        ConversationSummaryResponse res = toSummary(cv);
        ws.convertAndSend("/topic/support", new WsEvent("conversation.created", res));
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationSummaryResponse> list(String tab, Long meId, String q, Pageable pageable) {
        Page<SupportConversationEntity> page;
        if ("unassigned".equalsIgnoreCase(tab)) {
            page = convRepo.findByStatusOrderByLastMessageAtDesc("UNASSIGNED", pageable);
        } else if ("mine".equalsIgnoreCase(tab)) {
            UserEntity me = userRepo.getReferenceById(meId);
            page = convRepo.findByAssigneeAndStatusNotOrderByLastMessageAtDesc(me, "RESOLVED", pageable);
        } else {
            page = convRepo.findAllByOrderByLastMessageAtDesc(pageable);
        }
        // (Có thể filter “q” ở đây bằng Specification nếu cần)
        return page.map(this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> messages(Long conversationId, Pageable pageable) {
        SupportConversationEntity cv = convRepo.getReferenceById(conversationId);
        return msgRepo.findByConversationOrderByCreatedAtAsc(cv, pageable).map(this::toMsg);
    }

    @Override
    @Transactional
    public MessageResponse send(Long senderId, String senderRole, SendMessageRequest req) {
        SupportConversationEntity cv = convRepo.findById(req.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid conversationId"));

        UserEntity sender = null;
        if (senderId != null) {
            sender = userRepo.getReferenceById(senderId);
        }

        String role = "ADMIN".equalsIgnoreCase(senderRole) ? "ADMIN" : "USER";

        String clientId = req.getClientMsgId();

        SupportMessageEntity m = SupportMessageEntity.builder()
                .conversation(cv)
                .sender(sender) // null nếu guest
                .senderRole(role)
                .content(req.getContent())
                .clientMessageId(clientId) // <- field này cần có trong entity
                .createdAt(Instant.now())
                .build();

        if (req.getAttachments() != null && !req.getAttachments().isEmpty()) {
            for (AttachmentDto a : req.getAttachments()) {
                SupportAttachmentEntity att = SupportAttachmentEntity.builder()
                        .message(m)
                        .url(a.getUrl())
                        .name(a.getName())
                        .mimeType(a.getMimeType())
                        .sizeBytes(a.getSizeBytes())
                        .build();
                m.getAttachments().add(att);
            }
        }

        m = msgRepo.save(m);

        cv.setLastMessageAt(Instant.now());
        String preview = (req.getContent() != null && !req.getContent().isBlank())
                ? req.getContent() : "[Tệp]";
        cv.setLastMessagePreview(preview);

        if ("ADMIN".equals(role)) {
            cv.setUnreadForCustomer(Optional.ofNullable(cv.getUnreadForCustomer()).orElse(0) + 1);
            if (!"OPEN".equals(cv.getStatus())) cv.setStatus("OPEN");
        } else {
            cv.setUnreadForAssignee(Optional.ofNullable(cv.getUnreadForAssignee()).orElse(0) + 1);
            if (cv.getStatus() == null || cv.getStatus().isBlank()) cv.setStatus("UNASSIGNED");
        }
        convRepo.save(cv);

        MessageResponse res = toMsg(m);
        res.setClientMsgId(clientId); // để FE replace optimistic

        // 🔟 Gửi qua WebSocket
        ws.convertAndSend("/topic/support.conversation." + cv.getConversationId(),
                new WsEvent("message.created", res));
        ws.convertAndSend("/topic/support",
                new WsEvent("conversation.updated", toSummary(cv)));

        if (cv.getAssignee() != null && cv.getAssignee().getEmail() != null) {
            ws.convertAndSendToUser(
                    cv.getAssignee().getEmail(),
                    "/queue/support",
                    new WsEvent("message.created", res)
            );
        }

        return res;
    }

    @Override
    public ConversationSummaryResponse assignToMe(Long conversationId, Long meId) {
        SupportConversationEntity cv = convRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid conversationId"));
        if (cv.getAssignee() == null) {
            cv.setAssignee(userRepo.getReferenceById(meId));
            cv.setStatus("OPEN");
            cv.setUnreadForAssignee(0);
            convRepo.save(cv);
            ConversationSummaryResponse res = toSummary(cv);
            ws.convertAndSend("/topic/support", new WsEvent("conversation.assigned", res));
            return res;
        }
        return toSummary(cv);
    }

    @Override
    public void markRead(Long conversationId, String who) {
        SupportConversationEntity cv = convRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid conversationId"));
        if ("ADMIN".equalsIgnoreCase(who)) cv.setUnreadForAssignee(0);
        else cv.setUnreadForCustomer(0);
        convRepo.save(cv);
    }

    @Override
    public void deleteConversation(Long conversationId) {
        SupportConversationEntity cv = convRepo.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid conversationId"));
        // ---- Cách khuyến nghị: dựa vào cascade/orphanRemoval:
        convRepo.delete(cv);

        // ---- Nếu CHƯA có cascade/orphanRemoval, dùng xoá thủ công (bỏ comment nếu cần):
        // List<SupportMessageEntity> messages = msgRepo.findByConversation(cv);
        // if (!messages.isEmpty()) {
        //     // nếu có AttachmentRepository riêng, xóa attachments theo messages trước
        //     // attachmentRepo.deleteByMessageIn(messages);
        //     msgRepo.deleteAll(messages);
        // }
        // convRepo.delete(cv);

        // Thông báo FE cập nhật sidebar/thread
        ws.convertAndSend("/topic/support",
                new WsEvent("conversation.deleted",
                        java.util.Map.of("conversationId", conversationId)));
    }
}
