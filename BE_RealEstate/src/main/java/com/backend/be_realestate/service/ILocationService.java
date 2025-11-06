package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.OptionDTO;

import java.util.List;

public interface ILocationService {
    List<OptionDTO> getCities();
    List<OptionDTO> getDistricts(Long cityId);
    List<OptionDTO> getWards(Long districtId);
}
