package com.backend.be_realestate.service.scoredVerify;


import com.backend.be_realestate.modals.scoreVerify.VerifyAiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenRouterClient {

    private final WebClient webClient;
    private final ObjectMapper mapper;
    private final String model;

    public OpenRouterClient(
            WebClient.Builder builder,
            ObjectMapper mapper,
            @Value("${openrouter.api-key}") String apiKey,
            @Value("${openrouter.base-url}") String baseUrl,
            @Value("${openrouter.model}") String model
    ) {
        this.mapper = mapper;
        this.model = model;
        this.webClient = builder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public VerifyAiResponse verify(Map<String, Object> facts, List<String> documentUrls) {

        // 1️⃣ Prompt
        String prompt = """
Bạn là AI kiểm duyệt pháp lý bất động sản Việt Nam.

Nhiệm vụ:
- Đọc toàn bộ giấy tờ (ảnh/PDF).
- Trích xuất: tên chủ, địa chỉ, diện tích, loại giấy tờ.
- So sánh với FACTS của tin đăng.
- Chấm điểm khớp (0..1).
- Trả về JSON đúng format, KHÔNG kèm text ngoài JSON.

FORMAT JSON:
{
 "overallScore": number,
 "summary": string,
 "checks":[{"field":string,"score":number,"expected":string,"extracted":string,"evidence":string}],
 "missing":[string],
 "flags":[string]
}
""";

        // 2️⃣ Content (TEXT + IMAGE + PDF CHUNG 1 CHỖ)
        List<Object> content = new ArrayList<>();

        content.add(Map.of(
                "type", "text",
                "text", prompt + "\nFACTS:\n" + safeJson(facts)
        ));

        for (String url : documentUrls) {
            if (isImage(url)) {
                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", url)
                ));
            } else {
                content.add(Map.of(
                        "type", "file",
                        "file", Map.of("url", url)
                ));
            }
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "user", "content", content)
        ));

        // PDF OCR
        body.put("plugins", List.of(
                Map.of("id", "file-parser",
                        "pdf", Map.of("engine", "mistral-ocr"))
        ));

        String raw = webClient.post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode root = mapper.readTree(raw);
            String json = root.at("/choices/0/message/content").asText();
            return mapper.readValue(json, VerifyAiResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("AI parse failed", e);
        }
    }

    private boolean isImage(String url) {
        return url != null && url.matches("(?i).*(png|jpg|jpeg|webp)$");
    }

    private String safeJson(Object o) {
        try { return mapper.writeValueAsString(o); }
        catch (Exception e) { return "{}"; }
    }
}
