package com.backend.be_realestate.modals.dto.detail;

import lombok.Data;

import java.util.List;

@Data
public class AgentDetailDTO {
    private String name;
    private String avatar;
    private String otherPostsText;
    private String phoneMasked;
    private String phoneFull;
    private List<String> tags;
}

