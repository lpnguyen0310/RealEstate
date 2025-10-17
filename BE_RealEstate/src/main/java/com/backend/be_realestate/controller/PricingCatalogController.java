package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.packageEstate.ListingPackageDTO;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.PricingCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingCatalogController {

    private final PricingCatalogService service;

    // FE gọi endpoint này để render UI
    @GetMapping("/catalog")
    public ApiResponse<List<ListingPackageDTO>> getCatalog() {
        return ApiResponse.success(service.getActiveCatalog());
    }

    @GetMapping("/packages/{code}")
    public ApiResponse<ListingPackageDTO> getByCode(@PathVariable String code) {
        return ApiResponse.success(service.getByCode(code));
    }

    // Admin: tạo mới / cập nhật (upsert)
    @PostMapping("/packages")
    public ApiResponse<ListingPackageDTO> upsert(@RequestBody ListingPackageDTO dto) {
        return ApiResponse.success(service.upsertPackage(dto));
    }

    // Admin: bật/tắt hiển thị gói
    @PatchMapping("/packages/{id}/active")
    public ApiResponse<ListingPackageDTO> toggleActive(@PathVariable Long id,
                                                       @RequestParam boolean active) {
        return ApiResponse.success(service.toggleActive(id, active));
    }

    // Admin: xoá gói
    @DeleteMapping("/packages/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
