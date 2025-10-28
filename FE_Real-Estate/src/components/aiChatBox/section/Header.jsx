import React from "react";

export default function Header({ projectName, busy, lastError, onClear }) {
    const status =
        busy ? { cls: "bg-yellow-50/90 text-yellow-900 border-yellow-200", text: "Đang trả lời" } :
            lastError ? { cls: "bg-red-50/90 text-red-900 border-red-200", text: "Lỗi" } :
                { cls: "bg-emerald-50/90 text-emerald-900 border-emerald-200", text: "Sẵn sàng" };

    return (
        <div className="relative px-3 py-2 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />
            <div className="relative flex items-center gap-2">
                <span className="h-7 w-7 rounded-xl bg-white/20 grid place-items-center text-sm shadow-inner">🏠</span>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">Trợ lý BĐS • {projectName}</div>
                    <div className="text-[10px] opacity-90">Giá • Vay • Tiện ích • Tìm tin</div>
                </div>
                <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${status.cls}`}>
                    {status.text}
                </span>
                <button onClick={onClear} title="Xóa hội thoại" className="opacity-90 hover:opacity-100 ml-1">
                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0h10" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
