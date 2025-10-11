package com.backend.be_realestate.modals.dto.detail;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor // Thêm constructor để tiện sử dụng
public class MapMetaDTO {
    private String label;
    private String value;
}
