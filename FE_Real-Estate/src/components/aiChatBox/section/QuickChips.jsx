import React, { useRef } from "react";

export default function QuickChips({ items, onPick }) {
    const chipsRef = useRef(null);
    const scrollChips = (dx) => chipsRef.current?.scrollBy({ left: dx, behavior: "smooth" });

    return (
        <div className="relative p-2 border-t border-black/5 bg-white/85 backdrop-blur-md">
            <div
                ref={chipsRef}
                className="flex gap-1.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-px-2 scrollbar-none"
                style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            >
                {items.map((q) => (
                    <button
                        key={q.k}
                        onClick={() => onPick(q.text, q.display)}
                        className="shrink-0 snap-start text-[11px] whitespace-nowrap rounded-full px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-black/5 shadow-sm"
                    >
                        💡 {q.label}
                    </button>
                ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent"></div>
            <button
                type="button"
                onClick={() => scrollChips(-140)}
                className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-white/90 border border-black/10 shadow pointer-events-auto"
                title="Scroll left"
            >
                ‹
            </button>
            <button
                type="button"
                onClick={() => scrollChips(140)}
                className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-white/90 border border-black/10 shadow pointer-events-auto"
                title="Scroll right"
            >
                ›
            </button>
        </div>
    );
}
