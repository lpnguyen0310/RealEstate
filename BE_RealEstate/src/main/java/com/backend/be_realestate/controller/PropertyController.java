package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.PropertyCardDTO;

import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.service.IPropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final IPropertyService propertyService;

    @Autowired
    public PropertyController(IPropertyService propertyService) {
        this.propertyService = propertyService;
    }

    /**
     * API để lấy danh sách tất cả properties (dạng card rút gọn)
     * GET: /api/properties
     */
    @GetMapping
    public ResponseEntity<List<PropertyCardDTO>> getAllProperties() {
        List<PropertyCardDTO> properties = propertyService.getAllPropertiesForCardView();
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyDetailDTO> getPropertyById(@PathVariable Long id) {
        PropertyDetailDTO propertyDetail = propertyService.getPropertyDetailById(id);
        return ResponseEntity.ok(propertyDetail);
    }

}