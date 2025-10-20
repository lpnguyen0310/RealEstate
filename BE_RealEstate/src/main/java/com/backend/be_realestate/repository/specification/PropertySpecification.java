// File: src/main/java/com/backend/be_realestate/repository/specification/PropertySpecification.java
package com.backend.be_realestate.repository.specification;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.enums.PropertyType;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class PropertySpecification {

    // === PHƯƠNG THỨC BỊ THIẾU 1 ===
    public static Specification<PropertyEntity> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return cb.conjunction();

            // --- tokenize & normalize
            String kw = keyword.trim().toLowerCase();
            String[] raw = kw.split("\\s+");
            List<String> tokens = new ArrayList<>();
            for (String t : raw) if (t.length() >= 2) tokens.add(t);
            if (tokens.isEmpty()) return cb.conjunction();

            // --- fields (null-safe + lower)
            Expression<String> titleExpr = cb.lower(cb.coalesce(root.get("title"), ""));
            Expression<String> descExpr  = cb.lower(cb.coalesce(root.get("description"), ""));
            Expression<String> addrExpr  = cb.lower(cb.coalesce(root.get("displayAddress"), "")); // ƯU TIÊN

            // --- per-token: (addr OR title OR desc), AND giữa các token
            List<Predicate> must = new ArrayList<>();
            for (String t : tokens) {
                String like = "%" + t + "%";
                must.add(cb.or(
                        cb.like(addrExpr,  like),   // ưu tiên addr
                        cb.like(titleExpr, like),
                        cb.like(descExpr,  like)
                ));
            }

            // --- exact phrase (nới lỏng thêm)
            String phraseLike = "%" + kw + "%";
            Predicate phrase = cb.or(
                    cb.like(addrExpr,  phraseLike),
                    cb.like(titleExpr, phraseLike),
                    cb.like(descExpr,  phraseLike)
            );

            Predicate finalPred = cb.and(phrase, cb.and(must.toArray(new Predicate[0])));

            // --- ORDER BY RELEVANCE: displayAddress > title > description + tie-break postedAt
            // Chỉ áp khi SELECT entity (không áp lúc COUNT)
            if (PropertyEntity.class.equals(query.getResultType())) {
                // Trọng số: addr=5, title=3, desc=1
                Expression<Long> sAddr  = cb.<Long>selectCase().when(cb.like(addrExpr,  phraseLike), 5L).otherwise(0L);
                Expression<Long> sTitle = cb.<Long>selectCase().when(cb.like(titleExpr, phraseLike), 3L).otherwise(0L);
                Expression<Long> sDesc  = cb.<Long>selectCase().when(cb.like(descExpr,  phraseLike), 1L).otherwise(0L);

                Expression<Long> score = cb.sum(cb.sum(sAddr, sTitle), sDesc);

                // tie-break theo ngày đăng (đổi "postedAt" đúng tên field của bạn)
                query.orderBy(
                        cb.desc(score),
                        cb.desc(root.get("postedAt"))
                );
            }

            return finalPred;
        };
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
}