package com.backend.be_realestate.converter;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.modals.response.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor

public class UserConverter {
    @Autowired
    private ModelMapper modelMapper;
    private final AuthProviderConverter authProviderConverter;

    public UserDTO convertToDto(UserEntity entity) {
        UserDTO dto = modelMapper.map(entity, UserDTO.class);
        if (entity.getRoles() != null) {
            dto.setRoles(entity.getRoles().stream().map(r -> r.getCode()).toList());
        }
        dto.setAuthProvider(authProviderConverter.toDto(entity.getAuthProvider()));
        return dto;
    }

    public AdminUserResponse convertToAdminResponse(UserEntity e, int postsCount) {
        AdminUserResponse r = modelMapper.map(e, AdminUserResponse.class);

        // id
        r.setId(e.getUserId());

        // fullName
        String fullName = ((Objects.toString(e.getLastName(),"") + " " +
                Objects.toString(e.getFirstName(),"")).trim());
        r.setFullName(fullName.isEmpty() ? "(Chưa đặt)" : fullName);

        // status
        r.setStatus(Boolean.TRUE.equals(e.getIsActive()) ? "ACTIVE" : "LOCKED");

        // role (lấy role đầu tiên; tùy bạn định nghĩa ưu tiên)
        String role = (e.getRoles()!=null && !e.getRoles().isEmpty()) ? e.getRoles().get(0).getCode() : "USER";
        r.setRole(role);

        // deleteRequested
        r.setDeleteRequested(Boolean.TRUE.equals(e.getDeleteRequested()));
        //
        r.setLockRequested(Boolean.TRUE.equals(e.getLockRequested()));
        // postsCount
        r.setPostsCount(postsCount);

        // default fields
        if (r.getBalance() == null) r.setBalance(0L);
        if (r.getAddress() == null) r.setAddress("");
        if (r.getCreatedAt() == null && e.getCreatedAt()!=null) r.setCreatedAt(e.getCreatedAt().toInstant());

        return r;
    }
    public UserEntity convertToEntity(UserDTO dto) {
        return modelMapper.map(dto, UserEntity.class);
    }

}
