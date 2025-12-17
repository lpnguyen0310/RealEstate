package com.backend.be_realestate.service;

import com.backend.be_realestate.modals.ai.ScoredProperty;
import com.backend.be_realestate.modals.ai.UserPreference;
import com.backend.be_realestate.modals.dto.LegalCheckResult;

import java.util.List;

public interface IAIService {
    List<ScoredProperty> rerank(UserPreference pref, List<ScoredProperty> candidates, int topK);
    LegalCheckResult verifyLegalDocument(String imageUrl, String userContactName, float userArea,String userAddress);
}
