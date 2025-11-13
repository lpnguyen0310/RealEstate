package com.backend.be_realestate.utils;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.enums.PropertyType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.List;

public final class RecommendationSpec {
    private RecommendationSpec() {}

    public static Specification<PropertyEntity> statusPublished() {
        return (root, cq, cb) -> cb.equal(root.get("status"), PropertyStatus.PUBLISHED);
    }

    public static Specification<PropertyEntity> priceBetween(Double from, Double to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("price"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("price"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("price"), to);
            }
        };
    }

    public static Specification<PropertyEntity> areaBetween(Float from, Float to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("area"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("area"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("area"), to);
            }
        };
    }

    public static Specification<PropertyEntity> inPropertyTypes(Collection<PropertyType> types) {
        if (types == null || types.isEmpty()) return null;
        return (root, cq, cb) -> root.get("propertyType").in(types);
    }

    public static Specification<PropertyEntity> notInIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return (root, cq, cb) -> cb.not(root.get("id").in(ids));
    }

    // --- Exclusive (optional) ---
    public static Specification<PropertyEntity> priceBetweenExclusive(Double from, Double to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) {
                return cb.and(
                        cb.greaterThanOrEqualTo(root.get("price"), from),
                        cb.lessThan(root.get("price"), to)
                );
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("price"), from);
            } else {
                return cb.lessThan(root.get("price"), to);
            }
        };
    }

    public static Specification<PropertyEntity> areaBetweenExclusive(Float from, Float to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) {
                return cb.and(
                        cb.greaterThanOrEqualTo(root.get("area"), from),
                        cb.lessThan(root.get("area"), to)
                );
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("area"), from);
            } else {
                return cb.lessThan(root.get("area"), to);
            }
        };
    }

    public static Specification<PropertyEntity> orSafe(Specification<PropertyEntity> a,
                                                       Specification<PropertyEntity> b) {
        if (a == null) return b;
        if (b == null) return a;
        return (root, cq, cb) -> cb.or(a.toPredicate(root, cq, cb), b.toPredicate(root, cq, cb));
    }

    /** Dùng LEFT JOIN để không vô tình “inner join” loại bản ghi */
    public static Specification<PropertyEntity> inCityIds(Collection<Long> cityIds) {
        if (cityIds == null || cityIds.isEmpty()) return null;
        return (root, cq, cb) -> {
            Join<Object, Object> city = root.join("city", JoinType.LEFT);
            return city.get("id").in(cityIds);
        };
    }

    public static Specification<PropertyEntity> cityIdEquals(Long cityId) {
        if (cityId == null) return null;
        return (root, cq, cb) -> {
            Join<Object, Object> city = root.join("city", JoinType.LEFT);
            return cb.equal(city.get("id"), cityId);
        };
    }

    // ===== Helpers AND-safe =====

    /** AND an toàn cho 2 spec (giữ lại để tương thích cũ) */
    public static Specification<PropertyEntity> andSafe(Specification<PropertyEntity> a,
                                                        Specification<PropertyEntity> b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.and(b);
    }

    /** AND an toàn cho nhiều spec cùng lúc (varargs) */
    @SafeVarargs
    public static Specification<PropertyEntity> andSafe(Specification<PropertyEntity>... specs) {
        Specification<PropertyEntity> acc = null;
        if (specs == null) return null;
        for (Specification<PropertyEntity> s : specs) {
            if (s == null) continue;
            acc = (acc == null) ? s : acc.and(s);
        }
        return acc;
    }

    /** AND thêm điều kiện nếu condition != null */
    public static Specification<PropertyEntity> andIf(Specification<PropertyEntity> base,
                                                      Specification<PropertyEntity> condition) {
        return andSafe(base, condition);
    }
}
