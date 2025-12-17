package com.backend.be_realestate.controller.postVerify;

import com.backend.be_realestate.modals.scoreVerify.VerifyAiRequest;
import com.backend.be_realestate.modals.scoreVerify.VerifyAiResponse;
import com.backend.be_realestate.service.scoredVerify.PostVerifyAiService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/posts")
public class PostVerifyAiController {

    private final PostVerifyAiService service;

    public PostVerifyAiController(PostVerifyAiService service) {
        this.service = service;
    }

    @PostMapping("/{id}/verify-ai")
    public VerifyAiResponse verify(
            @PathVariable Long id,
            @RequestBody VerifyAiRequest req
    ) {
        return service.verify(req);
    }
}
