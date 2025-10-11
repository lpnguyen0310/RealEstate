package com.backend.be_realestate.modals.dto.detail;

import lombok.Data;

import java.util.List;

@Data
public class PostInfoDTO {
    private List<String> breadcrumb;
    private String title;
    private String address;
    private StatsDTO stats;
    private GrowthNoticeDTO growthNotice;

}
