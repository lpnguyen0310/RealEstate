package com.backend.be_realestate.modals.dto.detail;

import lombok.Data;

@Data
public class MapDTO {
    private java.math.BigDecimal lat;
    private java.math.BigDecimal lng;
    private int zoom = 16; // Giá trị mặc định
}

