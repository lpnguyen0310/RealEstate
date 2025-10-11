package com.backend.be_realestate.modals.dto.detail;

import lombok.Data;

import java.util.List;

@Data
public class DescriptionDTO {
    private String headline;
    private List<String> bullets;
    private String nearbyTitle;
    private List<String> nearby;
    private String priceLine;
    private String suggest;

}
