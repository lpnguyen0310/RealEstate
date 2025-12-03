import React from "react";

const REACTIONS = [
    { key: "like", emoji: "👍", label: "Thích" },
    { key: "love", emoji: "❤️", label: "Yêu thích" },
    { key: "haha", emoji: "😂", label: "Haha" },
    { key: "wow", emoji: "😮", label: "Wow" },
    { key: "sad", emoji: "😢", label: "Buồn" },
    { key: "angry", emoji: "😡", label: "Tức giận" },
];

export function ReactionPopover({ visible, onPick, align = "center" }) {
    if (!visible) return null;
    const posClass =
        align === "right"
            ? "right-0 translate-x-0"
            : align === "left"
                ? "left-0 -translate-x-0"
                : "left-1/2 -translate-x-1/2";

    return (
        <div
            className={`absolute -top-3 ${posClass} -translate-y-full opacity-100 pointer-events-auto select-none`}
        >
            <div className="flex items-center gap-1 rounded-2xl px-2 py-1 bg-black/80 text-white shadow-xl border border-black/30">
                {REACTIONS.map((r) => (
                    <button
                        key={r.emoji}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPick?.(r.emoji);
                        }}
                        className="h-9 w-9 rounded-full grid place-items-center text-xl hover:scale-110 transition"
                        title={r.label}
                    >
                        {r.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ReactionSummary({ data = {}, side = "right", onReact }) {
    const keys = Object.keys(data).filter((k) => data[k]?.count > 0);
    if (!keys.length) return null;

    const items = keys
        .map((k) => ({
            emoji: k,
            ...data[k],
        }))
        .sort(
            (a, b) =>
                (b.mine ? 1 : 0) - (a.mine ? 1 : 0) ||
                (b.count || 0) - (a.count || 0)
        );

    return (
        <div
            className={`mt-1 mb-1 flex flex-wrap gap-2 ${side === "right" ? "justify-end" : "justify-start"
                }`}
        >
            {items.map((it) => (
                <button
                    key={it.emoji}
                    onClick={() => onReact?.(it.emoji)}
                    className={`px-2 h-6 inline-flex items-center gap-1 rounded-full text-xs border cursor-pointer select-none
            bg-indigo-50 text-gray-700 border-gray-200 hover:bg-gray-50
            ${it.mine ? "border-blue-300 bg-blue-50 text-blue-700" : ""}`}
                    title={it.mine ? "Cảm xúc của bạn" : "Thả cảm xúc"}
                    type="button"
                >
                    <span className="text-[15px] leading-none">{it.emoji}</span>
                    <span className="leading-none">{it.count}</span>
                </button>
            ))}
        </div>
    );
}
