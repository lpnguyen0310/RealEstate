package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.AuthProviderEntity;
import com.backend.be_realestate.modals.dto.AuthProviderDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthProviderConverter {
    private final ModelMapper modelMapper;

    public AuthProviderDTO toDto(AuthProviderEntity entity) {
        if (entity == null) return null;
        return modelMapper.map(entity, AuthProviderDTO.class);
    }
}
