package com.backend.be_realestate.modals.dto.propertyEvent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Value;

@Value
public class PropertyEvent {
    Long id;
    String status;        // PENDING_REVIEW
    Long categoryId;
    String listingType;   // NORMAL/VIP/PREMIUM
    String title;
}