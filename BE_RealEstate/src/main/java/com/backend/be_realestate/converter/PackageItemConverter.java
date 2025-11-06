package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.ListingPackage;
import com.backend.be_realestate.entity.PackageItem;
import com.backend.be_realestate.exceptions.NotFoundException;
import com.backend.be_realestate.modals.dto.packageEstate.ListingPackageDTO;
import com.backend.be_realestate.modals.dto.packageEstate.PackageItemDTO;
import com.backend.be_realestate.repository.ListingPackageRepository; // <-- Import mới
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PackageItemConverter {

    private final ModelMapper modelMapper;

    // ===== THÊM DEPENDENCY MỚI =====
    // Cần Repository để tìm Gói Lẻ (childPackage) bằng ID
    private final ListingPackageRepository listingPackageRepository;

    // (Chúng ta không inject ListingPackageConverter ở đây để tránh lỗi Circular Dependency)

    /**
     * Chuyển Entity -> DTO
     * (Dùng khi BE gửi danh sách Gói Combo cho FE)
     */
    public PackageItemDTO toDto(PackageItem entity) {
        if (entity == null) return null;

        PackageItemDTO dto = new PackageItemDTO();
        dto.setId(entity.getId());
        dto.setQuantity(entity.getQuantity());

        // Map thủ công 'childPackage' (Entity) sang DTO con
        // (FE cần biết id, code, name của Gói Lẻ)
        if (entity.getChildPackage() != null) {
            ListingPackage childEntity = entity.getChildPackage();

            ListingPackageDTO childDto = new ListingPackageDTO();
            childDto.setId(childEntity.getId());
            childDto.setCode(childEntity.getCode());
            childDto.setName(childEntity.getName());

            dto.setChildPackage(childDto);
        }

        // (Bỏ logic Enum cũ)
        return dto;
    }

    /**
     * Chuyển DTO -> Entity
     * (Dùng khi FE gửi request "Tạo/Sửa Combo" lên BE)
     */
    public PackageItem toEntity(PackageItemDTO dto) {
        if (dto == null) return null;

        // 1. Map các trường đơn giản (id, quantity)
        PackageItem entity = modelMapper.map(dto, PackageItem.class);

        // 2. Xử lý 'childPackage' (DTO -> Entity)
        // FE gửi về { "childPackage": { "id": 123 }, "quantity": 5 }
        if (dto.getChildPackage() != null && dto.getChildPackage().getId() != null) {
            Long childPackageId = dto.getChildPackage().getId();

            // 3. Lấy Gói Lẻ (Entity) từ DB bằng ID
            ListingPackage childPackageEntity = listingPackageRepository.findById(childPackageId)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy Gói Lẻ (child package) với ID: " + childPackageId));

            // 4. Set entity đã được load vào
            entity.setChildPackage(childPackageEntity);
        } else {
            // Nếu FE không gửi ID của Gói Lẻ
            throw new IllegalArgumentException("PackageItem phải trỏ đến một childPackage (Gói Lẻ) hợp lệ.");
        }

        // (Bỏ logic Enum cũ)
        return entity;
    }
}