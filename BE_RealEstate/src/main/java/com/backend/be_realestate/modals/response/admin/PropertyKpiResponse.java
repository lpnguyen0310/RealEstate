package com.backend.be_realestate.modals.response.admin;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyKpiResponse {
    private Summary summary;
    private List<SeriesPoint> series;
    private RangeDto range;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private long total;           // tổng tin đăng trong kỳ (theo status lọc)
        private double compareToPrev; // tỷ lệ so kỳ trước (vd 0.153 = +15.3%)
        private long pending;         // số tin đang chờ duyệt (tuỳ status pending)
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SeriesPoint {
        private String date;  // YYYY-MM-DD (VN)
        private long count;   // số tin đăng / ngày
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RangeDto {
        private String start; // end-exclusive
        private String end;
    }
}
