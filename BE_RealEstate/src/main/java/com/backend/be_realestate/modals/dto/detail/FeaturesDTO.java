package com.backend.be_realestate.modals.dto.detail;

import lombok.Data;

import java.util.List;

@Data
public class FeaturesDTO {
    private List<FeatureItemDTO> left;
    private List<FeatureItemDTO> right;

}
