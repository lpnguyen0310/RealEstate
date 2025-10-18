package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.entity.UserInventoryEntity;
import com.backend.be_realestate.modals.dto.UserInventoryDTO;
import com.backend.be_realestate.repository.UserInventoryRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.UserInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserInventoryServiceImpl implements UserInventoryService {

    private final UserRepository userRepository;
    private final UserInventoryRepository inventoryRepository;

    @Override
    public List<UserInventoryDTO> getInventoryForUser(String email) {
        // 1. Tìm người dùng dựa trên email (lấy từ token)
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + email));

        // 2. Dùng repository để lấy tất cả vật phẩm của người dùng đó
        List<UserInventoryEntity> inventoryList = inventoryRepository.findAllByUser(user);

        // 3. Chuyển đổi danh sách Entity sang danh sách DTO để trả về
        return inventoryList.stream()
                .map(item -> new UserInventoryDTO(item.getItemType(), item.getQuantity()))
                .collect(Collectors.toList());
    }
}