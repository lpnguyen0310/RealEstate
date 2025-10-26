package com.backend.be_realestate.modals.response.admin;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewUsersKpiResponse {
    private Summary summary;
    private List<SeriesPoint> series;
    private RangeDto range;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private long total;
        private double compareToPrev; // 0.153 = +15.3%
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SeriesPoint {
        private String date; // "YYYY-MM-DD"
        private long count;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RangeDto {
        private String start; // LocalDateTime.toString()
        private String end;
    }
}