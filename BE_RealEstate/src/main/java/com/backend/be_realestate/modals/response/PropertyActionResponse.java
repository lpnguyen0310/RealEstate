package com.backend.be_realestate.modals.response;

import com.backend.be_realestate.enums.PropertyStatus;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyActionResponse {
    private Long id;
    private PropertyStatus newStatus;
    private String message;
}