package com.backend.be_realestate.utils;

import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.enums.PropertyStatus;
import com.backend.be_realestate.enums.PropertyType;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.List;

public class RecommendationSpec {
    public static Specification<PropertyEntity> statusPublished() {
        return (root, cq, cb) -> cb.equal(root.get("status"), PropertyStatus.PUBLISHED);
    }

    public static Specification<PropertyEntity> inPropertyTypes(List<PropertyType> types) {
        if (types == null || types.isEmpty()) return null;
        return (root, cq, cb) -> root.get("propertyType").in(types);
    }

    public static Specification<PropertyEntity> priceBetween(Double from, Double to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) return cb.between(root.get("price"), from, to);
            if (from != null) return cb.greaterThanOrEqualTo(root.get("price"), from);
            return cb.lessThanOrEqualTo(root.get("price"), to);
        };
    }

    public static Specification<PropertyEntity> areaBetween(Float from, Float to) {
        if (from == null && to == null) return null;
        return (root, cq, cb) -> {
            if (from != null && to != null) return cb.between(root.get("area"), from, to);
            if (from != null) return cb.greaterThanOrEqualTo(root.get("area"), from);
            return cb.lessThanOrEqualTo(root.get("area"), to);
        };
    }

    public static Specification<PropertyEntity> notInIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return (root, cq, cb) -> cb.not(root.get("id").in(ids));
    }
}
