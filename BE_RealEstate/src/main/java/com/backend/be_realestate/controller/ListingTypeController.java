package com.backend.be_realestate.controller;


import com.backend.be_realestate.modals.dto.AmenityDTO;
import com.backend.be_realestate.modals.dto.ListingTypePolicyDTO;
import com.backend.be_realestate.service.IAmenityService;
import com.backend.be_realestate.service.IListingTypePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/listingtype")
@RequiredArgsConstructor
public class ListingTypeController {

    private final IListingTypePolicyService listingTypePolicyService;

    @GetMapping
    public ResponseEntity<List<ListingTypePolicyDTO>> getAllListingType() {
        return ResponseEntity.ok(listingTypePolicyService.getAllListingTypePolicies());
    }
}