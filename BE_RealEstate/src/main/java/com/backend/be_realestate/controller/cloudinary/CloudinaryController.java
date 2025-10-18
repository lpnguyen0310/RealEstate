package com.backend.be_realestate.controller.cloudinary;

import com.backend.be_realestate.config.cloudinary.CloudinaryProps;
import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cloudinary")
@RequiredArgsConstructor
public class CloudinaryController {
    private final Cloudinary cloudinary;
    private final CloudinaryProps props;

    @PostMapping("/sign")
    public Map<String, Object> sign(@RequestBody(required = false) Map<String, Object> body) {
        String folder = props.getUploadFolder();
        if (body != null && body.get("folder") instanceof String f && !f.isBlank()) {
            folder = f;
        }

        long timestamp = System.currentTimeMillis() / 1000;

        Map<String, Object> params = new HashMap<>();
        params.put("timestamp", timestamp);
        params.put("folder", folder);
        // có thể ép thêm eager/context/tags/public_id nếu muốn

        String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

        Map<String, Object> res = new HashMap<>();
        res.put("timestamp", timestamp);
        res.put("signature", signature);
        res.put("apiKey", cloudinary.config.apiKey);
        res.put("cloudName", cloudinary.config.cloudName);
        res.put("folder", folder);
        return res;
    }
}