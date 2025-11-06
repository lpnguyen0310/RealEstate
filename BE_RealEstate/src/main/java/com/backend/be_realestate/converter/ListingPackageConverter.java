package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.ListingPackage;
import com.backend.be_realestate.entity.PackageItem;
import com.backend.be_realestate.enums.ListingType;
import com.backend.be_realestate.enums.PackageType;
import com.backend.be_realestate.modals.dto.packageEstate.ListingPackageDTO;
import com.backend.be_realestate.modals.dto.packageEstate.PackageItemDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors; // <-- Import thêm

@Component
@RequiredArgsConstructor
public class ListingPackageConverter {

    private final ModelMapper modelMapper;

    // (Converter con này là cần thiết cho logic "items")
    private final PackageItemConverter packageItemConverter;

    /**
     * Chuyển Entity -> DTO (Mô hình 2)
     */
    public ListingPackageDTO toDto(ListingPackage entity) {
        if (entity == null) return null;

        ListingPackageDTO dto = modelMapper.map(entity, ListingPackageDTO.class);

        // Map Enum -> String (Gói Lẻ hay Combo)
        if (entity.getPackageType() != null) {
            dto.setPackageType(entity.getPackageType().name());
        }

        // ===== (BỔ SUNG) THIẾU LOGIC MAP LISTING_TYPE =====
        // (Chỉ Gói Lẻ mới có)
        if (entity.getListingType() != null) {
            dto.setListingType(entity.getListingType().name());
        }
        // ===============================================

        // items -> itemsDTO (Gọi converter con để xử lý 'childPackage')
        if (entity.getItems() != null) {
            List<PackageItemDTO> itemDTOs = entity.getItems().stream()
                    .map(packageItemConverter::toDto) // <-- Gọi converter con
                    .collect(Collectors.toList());
            dto.setItems(itemDTOs);
        }

        return dto;
    }

    /**
     * Chuyển DTO -> Entity (Mô hình 2)
     * (Hàm của bạn, đã được sửa)
     */
    public ListingPackage toEntity(ListingPackageDTO dto) {
        if (dto == null) return null;

        ListingPackage entity = modelMapper.map(dto, ListingPackage.class);

        // String -> enum cho packageType (Logic này đã đúng)
        if (dto.getPackageType() != null && !dto.getPackageType().isBlank()) {
            entity.setPackageType(PackageType.valueOf(dto.getPackageType()));
        }

        // String -> enum cho listingType (Logic này đã đúng)
        if (dto.getListingType() != null && !dto.getListingType().isBlank()) {
            entity.setListingType(ListingType.valueOf(dto.getListingType()));
        }

        // itemsDTO -> items (giữ 2 chiều)
        if (dto.getItems() != null) {
            List<PackageItem> items = new ArrayList<>();
            for (PackageItemDTO iDto : dto.getItems()) {

                // Dùng converter con để đổi DTO {childPackage: {id:..}} -> Entity
                PackageItem item = packageItemConverter.toEntity(iDto);

                // ===== (SỬA) TÊN QUAN HỆ NGƯỢC =====
                item.setComboPackage(entity); // Sửa từ setPkg(entity)
                // ==================================

                items.add(item);
            }
            entity.setItems(items);
        }

        return entity;
    }
}