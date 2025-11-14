package com.backend.be_realestate.modals.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OptionDTO {
    private Long id;
    private String name;
    private String slug;
    private Double lat;
    private Double lng;
}
