import React from "react";
import { cn } from "../aiUtils";

export default function ToggleButton({ refEl, open, onToggle, sizeClass }) {
    return (
        <button
            ref={refEl}
            aria-label={open ? "Đóng chat" : "Mở chat"}
            onClick={onToggle}
            className={cn(
                `fixed bottom-4 right-4 z-50 ${sizeClass} rounded-2xl`,
                "bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 hover:brightness-110 text-white",
                "shadow-[0_20px_40px_-10px_rgba(99,102,241,0.55)] grid place-items-center border border-white/20"
            )}
        >
            {open ? (
                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            )}
        </button>
    );
}
