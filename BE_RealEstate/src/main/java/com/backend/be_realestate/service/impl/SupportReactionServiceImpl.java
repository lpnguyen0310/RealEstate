package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.SupportReactionEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.WsEvent;
import com.backend.be_realestate.modals.dto.ReactionDto;
import com.backend.be_realestate.repository.SupportMessageRepository;
import com.backend.be_realestate.repository.SupportReactionRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.ISupportReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportReactionServiceImpl implements ISupportReactionService {
    private final SupportReactionRepository reactionRepo;
    private final SupportMessageRepository msgRepo;
    private final SimpMessagingTemplate ws;
    private final UserRepository userRepo;
    @Override
    public List<ReactionDto> toggle(Long userId, Long messageId, String emoji) {
        var msg = msgRepo.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid messageId"));
        var userRef = userRepo.getReferenceById(userId);

        // kiểm tra nếu user đã thả cùng emoji -> gỡ
        var existing = reactionRepo.findByMessage_MessageIdAndUser_UserIdAndEmoji(messageId, userId, emoji);
        if (existing.isPresent()) {
            reactionRepo.delete(existing.get());
        } else {
            // thêm emoji mới
            var r = SupportReactionEntity.builder()
                    .message(msg)
                    .user(userRef)
                    .emoji(emoji)
                    .build();
            reactionRepo.save(r);
        }

        // trả về snapshot reactions hiện tại của message
        var now = reactionRepo.findByMessage_MessageId(messageId).stream()
                .map(x -> ReactionDto.builder()
                        .userId(x.getUser().getUserId())
                        .emoji(x.getEmoji())
                        .build())
                .toList();

        ws.convertAndSend("/topic/support.conversation." + msg.getConversation().getConversationId(),
                new WsEvent("reaction.updated", Map.of(
                        "messageId", messageId,
                        "conversationId", msg.getConversation().getConversationId(),
                        "reactions", now
                )));

        return now;
    }
}
