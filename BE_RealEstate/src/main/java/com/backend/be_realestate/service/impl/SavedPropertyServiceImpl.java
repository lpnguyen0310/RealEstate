package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.SavedPropertyEntity;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.SavedPropertyRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.savedPost.SavedPropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedPropertyServiceImpl implements SavedPropertyService {
    private final SavedPropertyRepository savedRepo;
    private final PropertyRepository propertyRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional
    public boolean toggle(Long userId, Long propertyId) {
        // Nếu đã lưu → xóa, chưa lưu → thêm mới
        if (savedRepo.existsByUserUserIdAndPropertyId(userId, propertyId)) {
            savedRepo.deleteByUserUserIdAndPropertyId(userId, propertyId);
            return false; // sau toggle là bỏ lưu
        }

        var user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var prop = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        savedRepo.save(SavedPropertyEntity.builder()
                .user(user)
                .property(prop)
                .build());
        return true;
    }

    @Override
    public boolean isSaved(Long userId, Long propertyId) {
        return savedRepo.existsByUserUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public List<Long> listIds(Long userId) {
        return savedRepo.findPropertyIdsByUser(userId);
    }
}
