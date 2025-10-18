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

@Component
@RequiredArgsConstructor
public class ListingPackageConverter {

    private final ModelMapper modelMapper;
    private final PackageItemConverter packageItemConverter;

    public ListingPackageDTO toDto(ListingPackage entity) {
        ListingPackageDTO dto = modelMapper.map(entity, ListingPackageDTO.class);

        // enum -> String
        dto.setPackageType(entity.getPackageType() != null ? entity.getPackageType().name() : null);

        // items -> itemsDTO
        if (entity.getItems() != null) {
            List<PackageItemDTO> itemDTOs = entity.getItems().stream()
                    .map(packageItemConverter::toDto)
                    .toList();
            dto.setItems(itemDTOs);
        }
        return dto;
    }

    public ListingPackage toEntity(ListingPackageDTO dto) {
        if (dto == null) return null; // Thêm kiểm tra null cho an toàn
        ListingPackage entity = modelMapper.map(dto, ListingPackage.class);

        // String -> enum cho packageType (bạn đã có)
        if (dto.getPackageType() != null && !dto.getPackageType().isBlank()) {
            entity.setPackageType(PackageType.valueOf(dto.getPackageType()));
        }

        if (dto.getListingType() != null && !dto.getListingType().isBlank()) {
            entity.setListingType(ListingType.valueOf(dto.getListingType()));
        }

        // itemsDTO -> items (giữ 2 chiều) (bạn đã có)
        if (dto.getItems() != null) {
            List<PackageItem> items = new ArrayList<>();
            for (PackageItemDTO iDto : dto.getItems()) {
                PackageItem item = packageItemConverter.toEntity(iDto);
                item.setPkg(entity);           // set back-reference
                items.add(item);
            }
            entity.setItems(items);
        }

        return entity;
    }
}
