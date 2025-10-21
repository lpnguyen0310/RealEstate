package com.backend.be_realestate.service.savedPost;

import java.util.List;

public interface SavedPropertyService {
    boolean toggle(Long userId, Long propertyId);

    boolean isSaved(Long userId, Long propertyId);

    List<Long> listIds(Long userId);
}
