package com.backend.be_realestate.service.scoredVerify;

import com.backend.be_realestate.modals.scoreVerify.VerifyAiRequest;
import com.backend.be_realestate.modals.scoreVerify.VerifyAiResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PostVerifyAiService {

    private final OpenRouterClient openRouter;

    public PostVerifyAiService(OpenRouterClient openRouter) {
        this.openRouter = openRouter;
    }

    public VerifyAiResponse verify(VerifyAiRequest req) {

        List<String> allDocs = new ArrayList<>();

        if (req.documents != null) {
            if (req.documents.deed != null) allDocs.addAll(req.documents.deed);
            if (req.documents.authorization != null) allDocs.addAll(req.documents.authorization);
        }

        return openRouter.verify(
                req.facts != null ? req.facts : Map.of(),
                allDocs
        );
    }
}
