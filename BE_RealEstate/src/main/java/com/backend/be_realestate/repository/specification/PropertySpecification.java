// File: src/main/java/com/backend/be_realestate/repository/specification/PropertySpecification.java
package com.backend.be_realestate.repository.specification;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.enums.PropertyType;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class PropertySpecification {

    // === PHƯƠNG THỨC BỊ THIẾU 1 ===
    // Helper: escape cho LIKE

    private static String escapeLike(String s) {
        return s.replace("\\","\\\\").replace("%","\\%").replace("_","\\_");
    }

    public static Specification<PropertyEntity> hasKeyword(String keyword, boolean matchAll) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return cb.conjunction();

            // --- normalize + tokenize ---
            String kwRaw = keyword.trim().toLowerCase();
            String[] raw = kwRaw.split("\\s+");
            List<String> tokens = new ArrayList<>();
            for (String t : raw) if (t.length() >= 2) tokens.add(t);
            if (tokens.isEmpty()) return cb.conjunction();

            // --- fields: title + displayAddress ---
            Expression<String> titleExpr = cb.lower(cb.coalesce(root.get("title"), ""));
            Expression<String> addrExpr  = cb.lower(cb.coalesce(root.get("displayAddress"), ""));

            // --- exact phrase ---
            String phraseLike   = "%" + escapeLike(kwRaw) + "%";
            String phrasePrefix = escapeLike(kwRaw) + "%";
            Predicate phrase = cb.or(
                    cb.like(addrExpr,  phraseLike, '\\'),
                    cb.like(titleExpr, phraseLike, '\\')
            );

            // --- per-token ---
            List<Predicate> perToken = new ArrayList<>();
            for (String t : tokens) {
                String like = "%" + escapeLike(t) + "%";
                perToken.add(cb.or(
                        cb.like(addrExpr,  like, '\\'),
                        cb.like(titleExpr, like, '\\')
                ));
            }
            Predicate tokenGroup = matchAll
                    ? cb.and(perToken.toArray(new Predicate[0]))
                    : cb.or(perToken.toArray(new Predicate[0]));

            Predicate finalPred = cb.or(phrase, tokenGroup);

            // --- relevance ordering ---
            if (PropertyEntity.class.equals(query.getResultType())) {
                Expression<Long> sAddrStarts  = cb.<Long>selectCase().when(cb.like(addrExpr,  phrasePrefix, '\\'), 8L).otherwise(0L);
                Expression<Long> sTitleStarts = cb.<Long>selectCase().when(cb.like(titleExpr, phrasePrefix, '\\'), 5L).otherwise(0L);
                Expression<Long> sAddr        = cb.<Long>selectCase().when(cb.like(addrExpr,  phraseLike,   '\\'), 4L).otherwise(0L);
                Expression<Long> sTitle       = cb.<Long>selectCase().when(cb.like(titleExpr, phraseLike,   '\\'), 2L).otherwise(0L);
                Expression<Long> score = cb.sum(cb.sum(cb.sum(sAddrStarts, sTitleStarts), cb.sum(sAddr, sTitle)), cb.literal(0L));

                query.orderBy(cb.desc(score), cb.desc(root.get("postedAt")));
            }
            return finalPred;
        };
    }


    public static Specification<PropertyEntity> isPublished() {
        return (root, query, cb) -> cb.equal(root.get("status"), PropertyStatus.PUBLISHED);
    }

    public static Specification<PropertyEntity> notExpired() {
        return (root, query, cb) -> cb.or(
                cb.isNull(root.get("expiresAt")),
                cb.greaterThan(root.get("expiresAt"), cb.currentTimestamp())
        );
    }

    // --- Phương thức bạn đã có ---
    public static Specification<PropertyEntity> hasPropertyType(String propertyType) {
        return (root, query, cb) -> {
            if (propertyType == null || propertyType.trim().isEmpty()) {
                return cb.conjunction();
            }
            try {
                return cb.equal(root.get("propertyType"), PropertyType.valueOf(propertyType));
            } catch (IllegalArgumentException e) {
                return cb.disjunction();
            }
        };
    }

    // --- Phương thức bạn đã có ---
    public static Specification<PropertyEntity> hasCategorySlug(String categorySlug) {
        return (root, query, cb) -> {
            if (categorySlug == null || categorySlug.trim().isEmpty()) {
                return cb.conjunction();
            }
            String finalSlug = categorySlug.startsWith("/") ? categorySlug.substring(1) : categorySlug;
            return cb.equal(root.get("category").get("slug"), finalSlug);
        };
    }

    // === PHƯƠNG THỨC BỊ THIẾU 2 ===
    public static Specification<PropertyEntity> priceBetween(Double priceFrom, Double priceTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (priceFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), priceFrom));
            }
            if (priceTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), priceTo));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // === PHƯƠNG THỨC BỊ THIẾU 3 ===
    public static Specification<PropertyEntity> areaBetween(Float areaFrom, Float areaTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (areaFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("area"), areaFrom));
            }
            if (areaTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("area"), areaTo));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<PropertyEntity> hasCity(Long cityId) {
        return (root, query, cb) -> {
            if (cityId == null) return cb.conjunction(); // không lọc nếu không có cityId
            return cb.equal(root.get("city").get("id"), cityId);
        };
    }

}