package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.modals.ai.ScoredProperty;
import com.backend.be_realestate.modals.ai.UserPreference;
import com.backend.be_realestate.modals.dto.LegalCheckResult;
import com.backend.be_realestate.service.IAIService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceOpenRouterImpl implements IAIService {

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${ai.rerank.url}")
    private String apiUrl;

    @Value("${ai.rerank.model:google/gemini-2.0-flash-exp:free}")
    private String model;

    // 🔥 FIX 1: Thêm biến visionModel (Quan trọng)
    @Value("${ai.vision.model:google/gemini-2.0-flash-exp:free}")
    private String visionModel;

    @Value("${OPENROUTER_KEY}")
    private String apiKey;

    @Value("${ai.rerank.timeoutMs:20000}")
    private int timeoutMs;

    private static final double W_BASE = 0.35;
    private static final double W_AI   = 0.65;

    @Override
    public List<ScoredProperty> rerank(UserPreference pref, List<ScoredProperty> candidates, int topK) {
        if (candidates == null || candidates.isEmpty()) return candidates;

        // Tiết kiệm token: chỉ gửi top theo baseScore
        int maxSend = Math.min(Math.max(topK * 4, 32), Math.max(candidates.size(), topK));
        List<ScoredProperty> send = candidates.stream()
                .sorted(Comparator.comparingDouble(ScoredProperty::getBaseScore).reversed())
                .limit(maxSend)
                .toList();

        String prompt = buildPrompt(pref, send, topK);
        log.info("[AI-RERANK] send={} topK={} model={}", send.size(), topK, model);
        log.debug("[AI-RERANK] prompt:\n{}", prompt);

        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0.2,
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "Bạn là mô hình RERANK BĐS. Luôn trả về JSON hợp lệ, không thêm giải thích."),
                            Map.of("role", "user", "content", prompt)
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "https://your-domain.com");
            headers.set("X-Title", "RealEstateX");

            ResponseEntity<String> res = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                log.warn("[AI-RERANK] HTTP {}: {}", res.getStatusCodeValue(), res.getBody());
                return fallbackByBase(send, topK, "http_error");
            }

            OpenRouterResp parsed = mapper.readValue(res.getBody(), OpenRouterResp.class);
            String content = Optional.ofNullable(parsed)
                    .filter(p -> p.getChoices()!=null && !p.getChoices().isEmpty())
                    .map(p -> p.getChoices().get(0))
                    .map(OpenRouterChoice::getMessage)
                    .map(OpenRouterMessage::getContent)
                    .orElse(null);

            if (content == null || content.isBlank()) {
                log.warn("[AI-RERANK] empty content");
                return fallbackByBase(send, topK, "empty_content");
            }

            // Chấp nhận 2 format:
            //  (A) {"scores":[{"id":1,"score":0.9}, ...]}
            //  (B) [{"id":1,"score":0.9}, ...]
            List<AiRankItem> ranked;
            String trimmed = content.trim();
            if (trimmed.startsWith("{")) {
                Map<String, Object> obj = mapper.readValue(content, new TypeReference<>() {});
                Object scores = obj.get("scores");
                if (scores instanceof List<?> l) {
                    ranked = mapper.convertValue(l, new TypeReference<List<AiRankItem>>() {});
                } else {
                    // fallback thử parse mảng luôn
                    ranked = mapper.readValue(content, new TypeReference<List<AiRankItem>>() {});
                }
            } else {
                ranked = mapper.readValue(content, new TypeReference<List<AiRankItem>>() {});
            }

            if (ranked == null || ranked.isEmpty()) {
                log.warn("[AI-RERANK] parsed scores empty");
                return fallbackByBase(send, topK, "empty_scores");
            }

            log.info("[AI-RERANK] ai-order={}", ranked.stream().map(AiRankItem::getId).toList());

            Map<Long, ScoredProperty> byId = send.stream()
                    .collect(Collectors.toMap(ScoredProperty::getId, it -> it, (a,b)->a, LinkedHashMap::new));

            // Gán aiScore + finalScore
            for (AiRankItem it : ranked) {
                ScoredProperty sp = byId.get(it.getId());
                if (sp == null) continue;
                double ai = clamp01(it.getScore());
                sp.setAiScore(ai);
                sp.setFinalScore(W_BASE * sp.getBaseScore() + W_AI * ai);
            }
            // Những item không có trong trả lời AI
            for (ScoredProperty sp : byId.values()) {
                if (sp.getFinalScore() == null) {
                    sp.setAiScore(0.0);
                    sp.setFinalScore(W_BASE * sp.getBaseScore());
                }
            }

            List<ScoredProperty> out = byId.values().stream()
                    .sorted(Comparator.comparing(ScoredProperty::getFinalScore).reversed())
                    .limit(topK)
                    .toList();

            // Log bảng điểm
            log.info("[AI-RERANK] topK results (id | base | ai | final)");
            for (ScoredProperty sp : out) {
                log.info("  {} | {} | {} | {}",
                        sp.getId(),
                        String.format("%.3f", sp.getBaseScore()),
                        String.format("%.3f", sp.getAiScore()),
                        String.format("%.3f", sp.getFinalScore())
                );
            }
            return out;

        } catch (Exception e) {
            log.warn("[AI-RERANK] Exception: {}", e.getMessage(), e);
            return fallbackByBase(send, topK, "exception");
        }
    }

    private String buildPrompt(UserPreference pref, List<ScoredProperty> items, int limit) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("user_id", pref.getUserId());
        ctx.put("limit", limit);

        // City signals
        ctx.put("anchor_city_id", pref.getAnchorCityId());
        ctx.put("near_city_ids", pref.getNearCityIds());
        ctx.put("preferred_city_ids", pref.getPreferredCityIds());
        ctx.put("fav_city_ids", pref.getFavCityIds());

        // Types
        ctx.put("fav_types", pref.getFavTypes());

        // Range
        ctx.put("price_min", pref.getPriceMin());
        ctx.put("price_max", pref.getPriceMax());
        ctx.put("area_min", pref.getAreaMin());
        ctx.put("area_max", pref.getAreaMax());

        // History / text signals
        ctx.put("saved_ids", pref.getSavedIds());
        ctx.put("keywords", pref.getKeywords());

        List<Map<String, Object>> cands = new ArrayList<>();
        for (ScoredProperty p : items) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("city_id", p.getCityId());
            m.put("type", p.getType() == null ? null : p.getType().name());
            m.put("price", p.getPrice());
            m.put("area", p.getArea());
            m.put("title", p.getTitle());
            m.put("desc", p.getDescription());
            m.put("base_score", p.getBaseScore());
            cands.add(m);
        }

        try {
            String ctxJson   = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(ctx);
            String candsJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(cands);

            // ⚠️ Để tránh lỗi font log, mình dùng tiếng Anh trong prompt
            return """
            You are a reranking model for real-estate listings.

            You receive:
            - user_pref: JSON with user preferences and constraints.
            - candidates: an array of listing objects.

            Your task:
            - Assign a relevance score in [0, 1] to as many candidates as possible.
            - Higher score = more relevant.
            - Then return ONLY JSON in one of these formats:
              {"scores":[{"id":<Long>,"score":<0..1>}, ...]}
              or
              [{"id":<Long>,"score":<0..1>}]

            Ranking rules (very important):

            1) City priority:
               - Strongly prioritize listings whose city_id == anchor_city_id (if present).
               - Next, prioritize city_id in near_city_ids.
               - Then prioritize city_id in preferred_city_ids or fav_city_ids.

            2) Type priority:
               - Prefer listings whose type is in fav_types.

            3) Price and area constraints:
               - If price_min/price_max are not null, prefer listings whose price is inside [price_min, price_max].
               - Slightly penalize listings far outside this range.
               - Similarly for area_min/area_max with area.

            4) Text matching:
               - If keywords are provided, prefer listings whose title/desc semantically match these keywords.
               - If saved_ids are provided, try to favor listings similar in style/content/location to the saved ones.

            5) Base score:
               - Use base_score as a weak prior: higher base_score is slightly better,
                 but you MAY override it when another listing is clearly more relevant
                 according to city, price/area constraints, or text matching.

            6) Output:
               - Return at most %d items (but you may include scores for more; the caller will truncate).
               - Do NOT include any explanation text. Return ONLY valid JSON.

            user_pref:
            %s

            candidates:
            %s
            """.formatted(limit, ctxJson, candsJson);

        } catch (Exception e) {
            log.warn("[AI-RERANK] buildPrompt error: {}", e.getMessage(), e);
            return "[]";
        }
    }


    private List<ScoredProperty> fallbackByBase(List<ScoredProperty> items, int k, String reason) {
        log.info("[AI-RERANK] fallback by base (reason={})", reason);
        return items.stream()
                .sorted(Comparator.comparing(ScoredProperty::getBaseScore).reversed())
                .limit(k)
                .toList();
    }

    private static double clamp01(Double v) {
        if (v == null) return 0.0;
        if (v.isNaN() || v.isInfinite()) return 0.0;
        return Math.max(0, Math.min(1, v));
    }

    /* ===== OpenRouter response mapping ===== */
    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OpenRouterResp { private List<OpenRouterChoice> choices; }
    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OpenRouterChoice { private OpenRouterMessage message; }
    @Data @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OpenRouterMessage { private String content; }

    @Data
    public static class AiRankItem { private Long id; private Double score; }

    @Override
    public LegalCheckResult verifyLegalDocument(String imageUrl, String userContactName, float userArea, String userAddress) {
        log.info("[AI-LEGAL] Verifying image: {}", imageUrl);

        try {
            // 1. Build Payload cho Vision Model
            Map<String, Object> userMessageContent = new HashMap<>();

            // --- SỬA LẠI PROMPT TEXT TẠI ĐÂY ---
            String promptText = String.format("""
                Bạn là AI chuyên gia thẩm định pháp lý BĐS Việt Nam. Nhiệm vụ:
                1. Đọc ảnh Sổ Đỏ/Sổ Hồng (Giấy chứng nhận quyền sử dụng đất).
                2. Trích xuất 3 thông tin: "Tên người sử dụng đất", "Diện tích" (số m2), và "Địa chỉ thửa đất".
                3. So sánh dữ liệu trích xuất với dữ liệu User nhập dưới đây:
                   - User nhập Tên: "%s"
                   - User nhập Diện tích: %s m2
                   - User nhập Địa chỉ: "%s"
                
                LƯU Ý QUAN TRỌNG VỀ ĐỊA CHỈ:
                - Địa chỉ trên Sổ đỏ thường ghi là: "Thửa đất số..., Tờ bản đồ số..., Xã/Phường..., Huyện/Quận..., Tỉnh/TP...".
                - Địa chỉ User nhập thường là: "Số nhà, Đường, Phường, Quận, TP".
                - Hãy đánh giá xem Phường/Xã, Quận/Huyện, Tỉnh/TP có khớp nhau không. Nếu sai lệch Quận/Huyện hoặc Tỉnh/TP thì trừ điểm nặng.
                
                4. Trả về JSON duy nhất (không markdown) theo mẫu:
                {
                  "confidenceScore": <0-100. Điểm tin cậy tổng hợp dựa trên độ khớp Tên, Diện tích và Địa chỉ>,
                  "extractedOwnerName": "<Tên đọc được từ ảnh>",
                  "extractedArea": <Số diện tích đọc được từ ảnh, nếu ko thấy trả về 0>,
                  "extractedAddress": "<Địa chỉ đọc được từ ảnh>",
                  "matchDetails": "<Nhận xét ngắn gọn tiếng Việt về độ khớp của cả 3 trường>",
                  "fraudSuspected": <true/false nếu ảnh mờ, bị cắt ghép, hoặc thông tin sai lệch hoàn toàn>
                }
                """, userContactName, userArea, userAddress); // <--- NHỚ THÊM userAddress VÀO ĐÂY
            // ------------------------------------

            List<Map<String, Object>> contentList = new ArrayList<>();

            // Phần Text
            contentList.add(Map.of("type", "text", "text", promptText));

            // Phần Ảnh (OpenRouter/OpenAI format)
            contentList.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", imageUrl)
            ));

            Map<String, Object> message = Map.of(
                    "role", "user",
                    "content", contentList
            );

            Map<String, Object> body = Map.of(
                    "model", visionModel,
                    "messages", List.of(message),
                    "temperature", 0.1,
                    "max_tokens", 1000
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "RealEstateApp");

            ResponseEntity<String> res = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            // 3. Parse Kết quả
            OpenRouterResp parsed = mapper.readValue(res.getBody(), OpenRouterResp.class);

            // Validate null safety
            if (parsed.getChoices() == null || parsed.getChoices().isEmpty()) {
                throw new RuntimeException("AI trả về rỗng");
            }

            String content = parsed.getChoices().get(0).getMessage().getContent();

            // Clean JSON
            String cleanJson = cleanJson(content);

            return mapper.readValue(cleanJson, LegalCheckResult.class);

        } catch (Exception e) {
            log.error("[AI-LEGAL] Error: {}", e.getMessage());
            LegalCheckResult fail = new LegalCheckResult();
            fail.setConfidenceScore(0.0);
            fail.setMatchDetails("Lỗi hệ thống AI: " + e.getMessage());
            fail.setFraudSuspected(false); // Default
            return fail;
        }
    }
    // Helper clean json tách ra dùng chung
    private String cleanJson(String content) {
        if (content == null) return "{}";
        String s = content.trim();
        if (s.startsWith("```")) {
            s = s.replaceAll("```json", "").replaceAll("```", "");
        }
        return s.trim();
    }
}
