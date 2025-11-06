package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.OptionDTO;
import com.backend.be_realestate.service.ILocationService;
import com.stripe.service.terminal.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {
    private final ILocationService service;

    @GetMapping("/cities")
    public List<OptionDTO> cities() { return service.getCities(); }

    @GetMapping("/districts")
    public List<OptionDTO> districts(@RequestParam Long cityId) {
        return service.getDistricts(cityId);
    }

    @GetMapping("/wards")
    public List<OptionDTO> wards(@RequestParam Long districtId) {
        return service.getWards(districtId);
    }
}
