package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.ReactionDto;

import java.util.List;

public interface ISupportReactionService {
    List<ReactionDto> toggle(Long userId, Long messageId, String emoji);
}
