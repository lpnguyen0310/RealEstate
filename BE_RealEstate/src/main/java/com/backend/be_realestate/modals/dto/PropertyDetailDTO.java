package com.backend.be_realestate.modals.dto;

import com.backend.be_realestate.modals.dto.detail.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class PropertyDetailDTO {
    private List<String> gallery;
    private PostInfoDTO postInfo;
    private DescriptionDTO description;
    private FeaturesDTO features;
    private MapDTO map;
    private List<MapMetaDTO> mapMeta;
    private AgentDetailDTO agent;
    private Long viewCount;
}



