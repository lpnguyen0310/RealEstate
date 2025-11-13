package com.backend.be_realestate.modals.ai;

import com.backend.be_realestate.enums.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoredProperty {
    private Long id;
    private String title;
    private String description;
    private Double price;
    private Float area;
    private Long cityId;
    private PropertyType type;
    private double baseScore;
    // điểm AI trả về [0..1]
    private Double aiScore;

    // điểm cuối cùng dùng để sort
    private Double finalScore;

    // tuỳ chọn: log chi tiết
    private Map<String, Object> debug;
}
