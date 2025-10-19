package com.backend.be_realestate.modals.property;

import lombok.*;

@Getter
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RejectPropertyRequest {
    private String reason;
}
