package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.ListingPackageConverter;
import com.backend.be_realestate.entity.ListingPackage;
import com.backend.be_realestate.enums.PackageType;
import com.backend.be_realestate.exceptions.BadRequestException;
import com.backend.be_realestate.exceptions.ConflictException;
import com.backend.be_realestate.exceptions.NotFoundException;
import com.backend.be_realestate.modals.dto.packageEstate.ListingPackageDTO;
import com.backend.be_realestate.repository.ListingPackageRepository;
import com.backend.be_realestate.service.PricingCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingCatalogServiceImpl implements PricingCatalogService {

    private final ListingPackageRepository packageRepo;
    private final ListingPackageConverter converter;

    @Override
    @Transactional(readOnly = true)
    public List<ListingPackageDTO> getActiveCatalog() {
        return packageRepo.findAllByIsActiveTrueOrderBySortOrderAscIdAsc()
                .stream()
                .map(converter::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ListingPackageDTO getByCode(String code) {
        ListingPackage entity = packageRepo.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy gói: " + code));
        return converter.toDto(entity);
    }

    @Override
    @Transactional
    public ListingPackageDTO upsertPackage(ListingPackageDTO dto) {
        // ===== Validate cơ bản =====
        if (dto.getCode() == null || dto.getCode().isBlank())
            throw new BadRequestException("Thiếu code");
        if (dto.getName() == null || dto.getName().isBlank())
            throw new BadRequestException("Thiếu name");
        if (dto.getPrice() == null || dto.getPrice() < 0)
            throw new BadRequestException("Giá phải >= 0");
        if (dto.getPackageType() == null)
            throw new BadRequestException("Thiếu packageType");

        boolean isCombo = PackageType.valueOf(dto.getPackageType()) == PackageType.COMBO;
        if (isCombo && (dto.getItems() == null || dto.getItems().isEmpty()))
            throw new BadRequestException("COMBO phải có ít nhất 1 item");
        if (!isCombo && dto.getItems() != null && !dto.getItems().isEmpty())
            throw new BadRequestException("SINGLE không được có items");

        // ===== Create/Update theo id -> code =====
        ListingPackage target;
        if (dto.getId() != null) {
            target = packageRepo.findById(dto.getId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy gói id=" + dto.getId()));
        } else {
            // nếu tạo mới, check trùng code
            if (packageRepo.existsByCode(dto.getCode()))
                throw new ConflictException("Mã gói đã tồn tại: " + dto.getCode());
            target = new ListingPackage();
        }

        // Map DTO -> Entity (bao gồm items, giữ 2 chiều)
        ListingPackage mapped = converter.toEntity(dto);

        // giữ id nếu là update
        if (target.getId() != null) {
            mapped.setId(target.getId());
        }

        // chuẩn hoá sortOrder nếu null
        if (mapped.getSortOrder() == null) {
            int lastOrder = packageRepo.findAll().stream()
                    .map(ListingPackage::getSortOrder)
                    .filter(o -> o != null)
                    .max(Comparator.naturalOrder())
                    .orElse(0);
            mapped.setSortOrder(lastOrder + 1);
        }

        ListingPackage saved = packageRepo.save(mapped);
        return converter.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!packageRepo.existsById(id)) {
            throw new NotFoundException("Không tìm thấy gói id=" + id);
        }
        packageRepo.deleteById(id);
    }

    @Override
    @Transactional
    public ListingPackageDTO toggleActive(Long id, boolean active) {
        ListingPackage entity = packageRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy gói id=" + id));
        entity.setIsActive(active);
        return converter.toDto(entity);
    }
}
