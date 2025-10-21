// src/components/dashboard/SavedListCard.jsx
import React from "react";

const FALLBACK =
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=600&auto=format&fit=crop";

export default function SavedListCard({
    items = [],
    title = "Tin yêu thích",
    maxItems = 5,
    onViewAll,
    onItemClick,
}) {
    const shown = items.slice(0, maxItems);

    return (
        <div className="rounded-2xl bg-[#f5f7fb] p-4 border border-[#e8edf6]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-[#1c396a] leading-none">
                    {title}
                </h3>
                <button
                    type="button"
                    onClick={onViewAll}
                    className="text-[13px] text-[#3b7cff] hover:underline leading-none"
                >
                    Xem tất cả
                </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3">
                {shown.length === 0 ? (
                    <div className="text-[14px] text-gray-500 bg-white rounded-xl p-4 border border-[#eef2f8] text-center">
                        Chưa có tin nào được lưu
                    </div>
                ) : (
                    shown.map((it) => (
                        <button
                            key={it.id}
                            type="button"
                            onClick={() => onItemClick?.(it)}
                            className="flex items-center gap-3 bg-white rounded-xl px-3 py-3 border border-[#eef2f8]
                         hover:border-[#cddfff] hover:shadow-[0_4px_14px_rgba(13,47,97,0.08)]
                         transition-all duration-200 text-left"
                        >
                            <img
                                src={it.image || FALLBACK}
                                alt={it.title || ""}
                                className="h-16 w-20 object-cover rounded-lg border border-[#eef2f8] flex-shrink-0"
                                onError={(e) => (e.currentTarget.src = FALLBACK)}
                                loading="lazy"
                            />

                            {/* Nội dung */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-semibold text-[#1c396a] truncate">
                                    {it.title || "Không có tiêu đề"}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-gray-500">
                                    {it.subtitle && (
                                        <span className="truncate max-w-[140px]" title={it.subtitle}>
                                            {it.subtitle}
                                        </span>
                                    )}
                                    {it.price && (
                                        <span className="text-[#d6402c] font-semibold whitespace-nowrap">
                                            {it.price}
                                        </span>
                                    )}
                                    {it.savedAgo && (
                                        <span className="whitespace-nowrap">
                                            • Đã lưu {it.savedAgo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Type badge */}
                            {it.type && (
                                <span className="text-[12px] px-2 py-1 rounded-md bg-[#f0f4ff] text-[#375a8b] whitespace-nowrap font-medium">
                                    {it.type}
                                </span>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
