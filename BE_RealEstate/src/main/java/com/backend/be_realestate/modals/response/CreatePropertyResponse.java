package com.backend.be_realestate.modals.response;


import com.backend.be_realestate.enums.PropertyStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreatePropertyResponse {
    private Long id;
    private PropertyStatus status;
}
