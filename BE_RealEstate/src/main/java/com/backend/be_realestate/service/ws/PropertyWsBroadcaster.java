package com.backend.be_realestate.service.ws;

import com.backend.be_realestate.modals.dto.propertyEvent.PropertyEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class PropertyWsBroadcaster {
    private final SimpMessagingTemplate ws;

    // Chỉ chạy sau khi transaction commit thành công
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCreated(PropertyEvent e) {
        ws.convertAndSend("/topic/admin/properties",
                // payload gọn để FE quyết định có refetch hay prepend
                new WsPayload("CREATED", e.getId(), e.getStatus(), e.getCategoryId(), e.getListingType(), e.getTitle())
        );
    }

    // DTO nhỏ cho WS
    record WsPayload(String type, Long id, String status, Long categoryId, String listingType, String title) {}
}