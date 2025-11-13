package com.backend.be_realestate.modals.ai;

import com.backend.be_realestate.enums.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {
    private Long userId;
    private List<Long> favCityIds;
    private List<PropertyType> favTypes;
    private Double maxPrice;
    private Float maxArea;
    private List<Long> savedIds;
    private List<String> keywords;
}
