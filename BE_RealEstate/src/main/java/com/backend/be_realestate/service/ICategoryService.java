package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.dto.CategoryDTO;

import java.util.List;

public interface ICategoryService {
    List<CategoryDTO> getAll();

}
