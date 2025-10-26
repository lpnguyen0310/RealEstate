package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.NotificationEntity;
import com.backend.be_realestate.modals.dto.NotificationDTO;
import org.springframework.stereotype.Component;

@Component
public class NotificationConverter {

    public NotificationDTO toDTO(NotificationEntity entity) {
        if (entity == null) {
            return null;
        }

        return NotificationDTO.builder()
                .id(entity.getId())
                .type(entity.getType().name())
                .message(entity.getMessage())
                .link(entity.getLink())
                .isRead(entity.isRead())
                .createdAt(entity.getCreatedAt()) // Giả sử bạn có trường createdAt trong Entity
                .build();
    }
}
