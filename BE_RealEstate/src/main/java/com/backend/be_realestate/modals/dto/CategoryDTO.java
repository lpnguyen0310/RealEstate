package com.backend.be_realestate.modals.dto;

import lombok.*;

@Getter
@Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryDTO {
    private Long id;
    private String name;
    private String slug;
}