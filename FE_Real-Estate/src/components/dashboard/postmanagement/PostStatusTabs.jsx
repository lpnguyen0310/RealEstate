import { useMemo } from "react";

export default function PostStatusTabs({
    activeKey = "active",
    onChange = () => { },
    counts = {},
    withCard = true,
    className = "",
}) {
    const TABS = useMemo(
        () => [
            { key: "active", label: "Đang Đăng", badgeColor: "bg-emerald-100 text-emerald-700", activeBg: "bg-[#13284b] text-white" },
            { key: "pending", label: "Chờ Duyệt", badgeColor: "bg-amber-100  text-amber-700", activeBg: "bg-[#13284b] text-white" },
            { key: "draft", label: "Nháp", badgeColor: "bg-indigo-100 text-indigo-700", activeBg: "bg-[#13284b] text-white" },
            { key: "rejected", label: "Bị Từ Chối", badgeColor: "bg-rose-100   text-rose-700", activeBg: "bg-[#13284b] text-white" },
            { key: "expired", label: "Hết Hạn", badgeColor: "bg-gray-300   text-gray-700", activeBg: "bg-[#13284b] text-white" },
            { key: "expiringSoon", label: "Sắp Hết Hạn", badgeColor: "bg-orange-100 text-orange-700", activeBg: "bg-[#13284b] text-white" },
            { key: "hidden", label: "Đã Ẩn", badgeColor: "bg-gray-200   text-gray-700", activeBg: "bg-[#13284b] text-white" },
            { key: "warned", label: "Bị Cảnh Cáo", badgeColor: "bg-yellow-100 text-yellow-700", activeBg: "bg-[#13284b] text-white" },
        ],
        []
    );

    return (
        <div className={`w-full ${className}`}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {TABS.map((t) => {
                    const isActive = activeKey === t.key;
                    const count = counts?.[t.key] ?? 0;

                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onChange(t.key)}
                            className={[
                                "group inline-flex items-center gap-2 rounded-xl px-4 py-2 transition font-semibold",
                                "focus:outline-none focus:ring-2 focus:ring-[#1d4b8f]/30",
                                isActive ? "bg-[#13284b] !text-white border border-transparent"
                                    : "bg-white text-[#13284b] border border-black/20 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <span className="font-semibold whitespace-nowrap">{t.label}</span>
                            <span className={["text-xs font-bold rounded-md px-2 py-0.5", isActive ? "bg-white/90 text-[#13284b]" : t.badgeColor].join(" ")}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
