package com.backend.be_realestate.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIService {
    private final RestTemplate restTemplate;

    @Value("${openrouter.api.key}") private String apiKey;
    @Value("${openrouter.model:openai/gpt-3.5-turbo}") private String model; // FE cũng đang default vậy

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final ObjectMapper OM = new ObjectMapper();

    public List<Long> rerankCandidates(Long userId, int limit,
                                       List<Map<String, Object>> candidates,
                                       Map<String, Object> userProfile) {
        final Set<Long> candidateIdSet = candidates.stream()
                .map(this::safeToLong)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (candidateIdSet.isEmpty() || limit <= 0) return Collections.emptyList();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("HTTP-Referer", "https://your-domain.example"); // khuyến nghị
        headers.add("X-Title", "RealEstateX Reco Rerank");          // khuyến nghị

        String sys = """
            You are a ranking engine. Given a user's profile and a list of real-estate candidates,
            return ONLY: {"ids":[<candidate ids in best-first order>]}.
            - "ids" must only include ids present in candidates.
            - Never invent IDs. If unsure, skip.
        """;

        Map<String, Object> payload = Map.of(
                "userId", userId,
                "limit", limit,
                "userProfile", userProfile,
                "candidates", candidates
        );

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", 0.2);
        body.put("max_tokens", 300);
        body.put("response_format", Map.of("type", "json_object")); // ép trả JSON
        body.put("messages", List.of(
                Map.of("role", "system", "content", sys),
                Map.of("role", "user", "content", toJson(payload))
        ));

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    OPENROUTER_URL, new HttpEntity<>(body, headers), Map.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Object choicesObj = resp.getBody().get("choices");
                if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
                    Object msg = ((Map<?, ?>) choices.get(0)).get("message");
                    if (msg instanceof Map<?, ?> m) {
                        String content = String.valueOf(m.get("content"));
                        List<Long> aiIds = parseIdsJson(content);
                        return aiIds.stream()
                                .filter(candidateIdSet::contains)
                                .distinct()
                                .limit(limit)
                                .toList();
                    }
                }
            }
        } catch (Exception e) {
            // TODO: log warn + phân nhánh 429/5xx nếu cần retry/backoff
        }
        return Collections.emptyList();
    }

    private Long safeToLong(Object v) {
        try { return v == null ? null : Long.valueOf(String.valueOf(v)); }
        catch (Exception e) { return null; }
    }
    private static String toJson(Object o) {
        try { return OM.writeValueAsString(o); } catch (Exception e) { return "{}"; }
    }
    private static List<Long> parseIdsJson(String content) {
        if (content == null || content.isBlank()) return Collections.emptyList();
        String cleaned = content.replace("```json", "").replace("```", "").trim();
        try {
            Map<String, Object> obj = OM.readValue(cleaned, new TypeReference<>() {});
            Object ids = obj.get("ids");
            if (ids instanceof List<?> list) {
                List<Long> out = new ArrayList<>(list.size());
                for (Object x : list) {
                    try {
                        Long id = Long.valueOf(String.valueOf(x));
                        out.add(id);
                    } catch (Exception ignored) {}
                }
                return out;
            }
        } catch (Exception ignored) {}
        return Collections.emptyList();
    }
}
