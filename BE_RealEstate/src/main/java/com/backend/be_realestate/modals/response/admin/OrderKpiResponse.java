package com.backend.be_realestate.modals.response.admin;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderKpiResponse {
    private Summary summary;
    private List<SeriesPoint> series;
    private RangeDto range;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private long orders;             // tổng số đơn trong kỳ
        private long revenue;            // tổng doanh thu (VND) trong kỳ
        private double compareOrders;    // so với kỳ trước (tỷ lệ, vd 0.12 = +12%)
        private double compareRevenue;   // so với kỳ trước (tỷ lệ)
        private long previousOrders;     // tổng số đơn KỲ TRƯỚC
        private long previousRevenue;    // tổng doanh thu KỲ TRƯỚC
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SeriesPoint {
        private String date;   // YYYY-MM-DD theo VN
        private long orders;   // số đơn / ngày
        private long revenue;  // doanh thu / ngày
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RangeDto {
        private String start;  // LocalDateTime.toString(), end-exclusive
        private String end;
    }
}