import React from "react";

export default function InputBar({ inputRef, value, setValue, busy, onSend }) {
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSend(); }}
            className="flex items-end gap-1.5 p-2 border-t border-black/5 bg-white/90 backdrop-blur-md"
        >
            <div className="flex-1 relative">
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Nhập câu hỏi tự nhiên… hoặc /help"
                    className="w-full resize-none rounded-2xl border border-black/10 px-3 py-2 text-[13px] leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
                    }}
                />
                <div className="pointer-events-none absolute right-2 bottom-2 text-[10px] text-zinc-400">
                    {value.trim().length ? `${value.length} ký tự` : ""}
                </div>
            </div>
            <button
                type="submit"
                disabled={!value.trim() || busy}
                className={`shrink-0 rounded-2xl px-3 py-2 text-[13px] font-medium shadow-md transition ${busy || !value.trim() ? "bg-zinc-200 text-zinc-400" : "bg-indigo-600 text-white hover:brightness-110"
                    }`}
                title="Gửi"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-4 7 4 7-14-7z" />
                </svg>
            </button>
        </form>
    );
}
