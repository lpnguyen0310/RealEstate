 package com.backend.be_realestate.modals.dto;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AgentDTO {
    private String name; // Tên đầy đủ
    private String avatar;
    private String phone;
    private String zaloUrl;
}