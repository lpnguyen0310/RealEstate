// src/components/dashboard/ordermanagement/TxStatusTabs.jsx
import React, { useMemo } from "react";

/**
 * Tabs lọc trạng thái đơn hàng – kéo ngang trên mobile
 * @param {string} activeKey - 'all' | 'success' | 'processing' | 'canceled'
 * @param {function} onChange - (key) => void
 * @param {object} counts - { all, success, processing, canceled }
 * @param {string} className
 */
export default function TxStatusTabs({
    activeKey = "all",
    onChange = () => { },
    counts = {},
    className = "",
}) {
    const TABS = useMemo(
        () => [
            { key: "all", label: "Tất cả", badgeColor: "bg-slate-100  text-slate-700" },
            { key: "success", label: "Thành Công", badgeColor: "bg-emerald-100 text-emerald-700" },
            { key: "processing", label: "Đang Xử Lý", badgeColor: "bg-amber-100  text-amber-700" },
            { key: "canceled", label: "Đã Hủy", badgeColor: "bg-rose-100   text-rose-700" },
        ],
        []
    );

    return (
        <div
            className={[
                "w-full rounded-2xl border border-[#e8edf6] bg-white shadow-[0_6px_18px_rgba(13,47,97,0.06)]",
                className,
            ].join(" ")}
        >
            {/* Lớp ngoài cho phép scroll ngang */}
            <div className="overflow-x-auto no-scrollbar">
                {/* Lớp trong w-max để tạo bề ngang thực */}
                <div className="flex flex-nowrap gap-2 px-2 py-3 w-max">
                    {TABS.map((t) => {
                        const isActive = activeKey === t.key;
                        const count = counts?.[t.key] ?? 0;

                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => onChange(t.key)}
                                className={[
                                    "group inline-flex items-center gap-2 rounded-xl px-4 py-2 transition font-semibold whitespace-nowrap",
                                    "focus:outline-none focus:ring-2 focus:ring-[#1d4b8f]/30",
                                    isActive
                                        ? "bg-[#13284b] !text-white border border-transparent"
                                        : "bg-white text-[#13284b] border border-black/20 hover:bg-slate-50",
                                ].join(" ")}
                            >
                                <span className="font-semibold">{t.label}</span>
                                <span
                                    className={[
                                        "text-xs font-bold rounded-md px-2 py-0.5",
                                        isActive ? "bg-white/90 text-[#13284b]" : t.badgeColor,
                                    ].join(" ")}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
