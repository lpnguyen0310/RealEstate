import React from "react";
import PropertyMiniCard from "../PropertyMiniCard";
import { timeAgoVi } from "../aiUtils";

function Bubble({ msg, prev }) {
    const isUser = msg.role === "user";
    const sameAsPrev = prev && prev.role === msg.role;

    const contentView =
        msg.kind === "cards" ? (
            <div className="w-full max-w-full overflow-hidden">
                <div
                    className="flex gap-[70px] overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-thin pb-1 -mx-[5px] px-[5px]"
                    style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
                >
                    {Array.isArray(msg.cards) && msg.cards.length ? (
                        msg.cards.map((it) => (
                            <div key={it.id} className="shrink-0 snap-start w-[220px]">
                                <PropertyMiniCard item={it} />
                            </div>
                        ))
                    ) : (
                        <div className="text-[12px] text-zinc-500">Không có kết quả.</div>
                    )}
                </div>
            </div>
        ) : (
            <div
                className={
                    isUser
                        ? "px-3 py-2 text-[13px] leading-5 whitespace-pre-wrap shadow-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm"
                        : "px-3 py-2 text-[13px] leading-5 whitespace-pre-wrap shadow-sm bg-white text-zinc-900 border border-black/5 rounded-2xl rounded-bl-sm"
                }
                style={{
                    borderTopLeftRadius: !isUser && sameAsPrev ? "8px" : "16px",
                    borderTopRightRadius: isUser && sameAsPrev ? "8px" : "16px",
                }}
            >
                {msg.content}
            </div>
        );

    return (
        <div className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className={`mr-2 transition-all ${sameAsPrev ? "opacity-0 w-6" : "opacity-100 w-6"}`}>
                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white grid place-items-center text-[11px] shadow-inner">🏠</div>
                </div>
            )}

            <div className={`max-w-[84%] min-w-0 flex flex-col items-start ${isUser ? "items-end" : ""}`}>
                {contentView}
                <div className={`mt-1 text-[10px] text-zinc-400 ${isUser ? "text-right pr-1" : "text-left pl-1"}`}>{timeAgoVi(msg.ts)}</div>
            </div>

            {isUser && (
                <div className={`ml-2 transition-all ${sameAsPrev ? "opacity-0 w-6" : "opacity-100 w-6"}`}>
                    <div className="h-6 w-6 rounded-full bg-fuchsia-600 text-white grid place-items-center text-[11px] shadow-inner">🙋</div>
                </div>
            )}
        </div>
    );
}

function Typing() {
    return (
        <div className="mb-2 flex justify-start">
            <div className="mr-2 w-6">
                <div className="h-6 w-6 rounded-full bg-indigo-600 text-white grid place-items-center text-[11px]">🏠</div>
            </div>
            <div className="bg-white border border-black/5 rounded-2xl px-3 py-2 shadow-sm">
                <span className="inline-flex gap-1 align-middle">
                    <i className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
                    <i className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
                    <i className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" />
                </span>
            </div>
        </div>
    );
}

export default function Messages({ listRef, messages, busy, msgHClass }) {
    return (
        <div ref={listRef} className={`${msgHClass} overflow-y-auto px-3 py-3 bg-gradient-to-b from-zinc-50 via-white to-white`}>
            {messages.map((m, i) => (
                <Bubble key={m.id} msg={m} prev={messages[i - 1]} />
            ))}
            {busy && <Typing />}
        </div>
    );
}
