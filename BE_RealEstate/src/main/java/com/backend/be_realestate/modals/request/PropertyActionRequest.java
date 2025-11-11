package com.backend.be_realestate.modals.request;


import com.backend.be_realestate.enums.PropertyAction;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyActionRequest {
    private PropertyAction action; // HIDE, UNHIDE, MARK_SOLD, UNMARK_SOLD
    private String note;            // (tuỳ chọn) ghi chú, lý do, ngày giao dịch...
}