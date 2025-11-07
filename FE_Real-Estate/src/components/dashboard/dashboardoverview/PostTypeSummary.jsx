// src/components/dashboard/dashboardoverview/PostTypeSummary.jsx
import React from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";

// Lấy myList từ store.property
const selectMyList = (s) => s.property?.myList ?? [];

// Tính tổng views / interactions / potential theo propertyType (sell|rent)
const selectPostTypeSummary = createSelector(selectMyList, (posts) => {
    const initAgg = () => ({ views: 0, interactions: 0, potential: 0 });
    const agg = { sell: initAgg(), rent: initAgg() };

    for (const p of posts) {
        const type = String(p?.installmentText || "")
            .toLowerCase()
            .includes("thuê")
            ? "rent"
            : String(p?.installmentText || "").toLowerCase().includes("bán")
                ? "sell"
                : null;

        // Nếu BE có p.propertyType = "sell"/"rent", dùng trực tiếp:
        // const type = ["sell", "rent"].includes(p?.propertyType) ? p.propertyType : null;

        if (!type) continue;
        const views = Number.isFinite(p?.views) ? p.views : 0;
        const interactions = Number.isFinite(p?.interactions)
            ? p.interactions
            : Number.isFinite(p?.inquiries)
                ? p.inquiries
                : 0;
        const potential = Number.isFinite(p?.potential)
            ? p.potential
            : Number.isFinite(p?.leadCount)
                ? p.leadCount
                : 0;

        agg[type].views += views;
        agg[type].interactions += interactions;
        agg[type].potential += potential;
    }

    return agg; // { sell: {...}, rent: {...} }
});

export default function PostTypeSummary({ sell = {}, rent = {} }) {
    const auto = useSelector(selectPostTypeSummary);
    const sellData = Object.keys(sell).length ? sell : auto.sell;
    const rentData = Object.keys(rent).length ? rent : auto.rent;

    return (
        <div className="space-y-3 sm:space-y-4">
            <SummaryCard title="Tin đăng bán" data={sellData} />
            <SummaryCard title="Tin đăng cho thuê" data={rentData} />
        </div>
    );
}

function SummaryCard({ title, data }) {
    const d = { views: 0, interactions: 0, potential: 0, ...data };
    return (
        <div className="rounded-2xl bg-white p-4 border border-[#e8edf6] shadow-[0_8px_24px_rgba(13,47,97,0.06)]">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1c396a] mb-3">{title}</h3>
            <div className="border-t-2 border-[#3b7cff]/60 mb-3" />
            <div className="space-y-2 sm:space-y-3">
                <Row label="Lượt xem" value={d.views} />
                <Row label="Lượt tương tác" value={d.interactions} />
                <Row label="Khách tiềm năng" value={d.potential} />
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[13px] sm:text-[14px] text-[#3c4a5d]">{label}</span>
            <span className="text-[13px] sm:text-[14px] text-[#3c4a5d] font-semibold">
                {Number(value || 0).toLocaleString("vi-VN")}
            </span>
        </div>
    );
}
