package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.modals.dto.OptionDTO;
import com.backend.be_realestate.repository.CityRepository;
import com.backend.be_realestate.repository.DistrictRepository;
import com.backend.be_realestate.repository.WardRepository;
import com.backend.be_realestate.service.ILocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationServiceImpl implements ILocationService {
    private final CityRepository cityRepo;
    private final DistrictRepository districtRepo;
    private final WardRepository wardRepo;
    @Override
    public List<OptionDTO> getCities() {
        return cityRepo.findAll(Sort.by("name"))
                .stream()
                .map(c -> new OptionDTO(
                        c.getId(),
                        c.getName(),
                        c.getSlug(),
                        c.getLat(),
                        c.getLng()
                ))
                .toList();
    }
    @Override
    public List<OptionDTO> getDistricts(Long cityId) {
        return districtRepo.findByCity_IdOrderByNameAsc(cityId)
                .stream()
                .map(d -> new OptionDTO(
                        d.getId(),
                        d.getName(),
                        d.getSlug(),
                        d.getLat(),
                        d.getLng()
                ))
                .toList();
    }

    @Override
    public List<OptionDTO> getWards(Long districtId) {
        return wardRepo.findByDistrict_IdOrderByNameAsc(districtId)
                .stream()
                .map(w -> new OptionDTO(
                        w.getId(),
                        w.getName(),
                        w.getSlug(),
                        w.getLat(),
                        w.getLng()
                ))
                .toList();
    }
}
