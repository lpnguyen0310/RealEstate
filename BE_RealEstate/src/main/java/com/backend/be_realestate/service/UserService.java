package com.backend.be_realestate.service;

import com.backend.be_realestate.converter.UserConverter;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.modals.dto.UserDTO;
import com.backend.be_realestate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private  final UserRepository userRepo;
    private final UserConverter userConverter;

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(Authentication auth) {
        if (auth == null) return null;
        String identifier = auth.getName(); // email hoặc phone
        UserEntity user = userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByPhone(identifier))
                .orElse(null);
        return (user == null) ? null : userConverter.convertToDto(user);
    }
}
