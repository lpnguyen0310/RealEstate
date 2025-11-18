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

    // LIKE CŨ
    private List<Long> favCityIds;
    private List<PropertyType> favTypes;
    private Double maxPrice;   // => sẽ đổi thành priceMax
    private Double maxArea;    // => sẽ đổi thành areaMax
    private List<Long> savedIds;
    private List<String> keywords;

    private Long anchorCityId;       // city FE đang chọn chính
    private List<Long> nearCityIds;  // city lân cận FE gửi lên
    private List<Long> preferredCityIds; // anchor + near + favCityIds

    private Double priceMin;
    private Double priceMax;
    private Float  areaMin;
    private Float  areaMax;

    private Integer limit; // optional: số lượng muốn lấy tối đa
}
