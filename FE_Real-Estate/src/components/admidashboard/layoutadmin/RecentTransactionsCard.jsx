import React from "react";

export default function RecentTransactionsCard({ items = [] }) {
    const signClass = (amountStr = "") =>
        amountStr.trim().startsWith("-") ? "text-red-600" : "text-emerald-600";

    const chipClass = (desc = "") => {
        const s = (desc || "").toLowerCase();
        if (s.includes("vip") || s.includes("đặc biệt") || s.includes("top"))
            return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
        if (s.includes("đăng tin") || s.includes("đơn"))
            return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
        return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
    };

    const displayItems = items.slice(0, 4);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Giao dịch gần đây</h3>
                <button
                    className="text-sm px-3 h-8 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
                    type="button"
                >
                    Xem tất cả
                </button>
            </div>

            {/* List */}
            <ul className="divide-y divide-gray-100">
                {displayItems.map((t, i) => (
                    <li
                        key={i}
                        className="
              grid items-center gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/70 transition-colors
              [grid-template-columns:minmax(0,1fr)_150px_110px]
              min-h-[56px]
            "
                    >
                        {/* LEFT */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`shrink-0 w-10 h-10 rounded-full ${t.iniBg} flex items-center justify-center ring-1 ring-black/5`}>
                                <span className={`font-bold ${t.iniText} text-sm tracking-wide`}>{t.ini}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate leading-tight">{t.name}</p>
                                <p className="text-xs text-gray-500 leading-none mt-1">
                                    {t.time || "vừa xong"} · {t.wallet || "ví MoMo"}
                                </p>
                            </div>
                        </div>

                        {/* MIDDLE */}
                        <div className="flex justify-center">
                            <span className={`inline-flex items-center h-6 px-2.5 rounded-full ${chipClass(t.desc)}`} title={t.desc}>
                                <span className="text-[12px] font-medium leading-none">{t.desc}</span>
                            </span>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center justify-end gap-2 ">
                            <p className={`font-semibold text-sm tabular-nums leading-none ${signClass(t.amount)}`} style={{ marginBottom: 0 }}>
                                {t.amount}
                            </p>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </li>
                ))}

                {items.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">Chưa có giao dịch</li>
                )}
            </ul>
        </div>
    );
}
