package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserConverter {
    @Autowired
    private ModelMapper modelMapper;

    public UserDTO convertToDto(UserEntity entity) {
        UserDTO dto = modelMapper.map(entity, UserDTO.class);
        if (entity.getRoles() != null) {
            dto.setRoles(entity.getRoles().stream().map(r -> r.getCode()).toList());
        }
        return dto;
    }

    public UserEntity convertToEntity(UserDTO dto) {
        return modelMapper.map(dto, UserEntity.class);
    }
}
