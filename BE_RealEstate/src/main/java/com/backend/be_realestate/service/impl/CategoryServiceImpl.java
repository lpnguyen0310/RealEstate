package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.converter.CategoryConverter;
import com.backend.be_realestate.modals.dto.CategoryDTO;
import com.backend.be_realestate.repository.CategoryRepository;
import com.backend.be_realestate.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements ICategoryService {

    private final CategoryRepository repo;
    private final CategoryConverter mapper;

    @Override
    public List<CategoryDTO> getAll() {
        return repo.findAll().stream().map(mapper::convertToDto).toList();
    }
}