package com.backend.be_realestate.modals.dto;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class PropertyCardDTO {
    private Long id;
    private String image;
    private String title;
    private String price;
    private String pricePerM2;
    private String postedAt;
    private int photos;
    private String addressShort;
    private String addressFull; // <-- BỔ SUNG LẠI TRƯỜNG NÀY
    private float area;
    private int bed;
    private int bath;
    private AgentDTO agent;
    private String type;
    private String category;
    private String description;
    private List<String> images;
    private String listing_type;
    private Long viewCount;
}
