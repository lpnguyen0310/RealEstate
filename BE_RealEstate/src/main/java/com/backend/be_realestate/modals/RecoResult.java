package com.backend.be_realestate.modals;
import com.backend.be_realestate.modals.dto.PropertyCardDTO;
import lombok.*;

import java.util.List;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class RecoResult {
    private List<PropertyCardDTO> items;
    private String source; // "personalized", "nearby", "empty", ...
    private Long anchorCityId;
    private List<Long> nearCityIds;
}