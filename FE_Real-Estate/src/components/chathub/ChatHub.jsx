// src/components/chat-hub/ChatHub.jsx
import React, { useEffect, useRef, useState } from "react";
import AIChatWidget from "@/components/aiChatBox/AIChatWidget";
import SupportChatWidget from "@/components/supportchat/SupportChatWidget";

export default function ChatHub({ user, size = "md" }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("ai");
    const baseOffset = { right: 24, bottom: 24 };
    const fabRef = useRef(null);
    const panelRef = useRef(null);
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            const inPanel = panelRef.current?.contains(e.target);
            const inFab = fabRef.current?.contains(e.target);
            if (!inPanel && !inFab) setOpen(false);
        };
        const onEsc = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown, { passive: true });
        document.addEventListener("keydown", onEsc);

        // Lock scroll nền khi mở panel (mobile Safari thân thiện)
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onEsc);
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    return (
        <>
            <div
                className={`fixed inset-0 z-[9400] bg-black/20 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />
            <button
                ref={fabRef}
                onClick={() => setOpen((o) => !o)}
                style={{
                    position: "fixed",
                    left: baseOffset.right,
                    bottom: baseOffset.bottom,
                    zIndex: 10000,
                }}
                className={`h-14 w-14 rounded-full grid place-items-center shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-600 text-white ${open ? "rotate-0" : "rotate-0"}`}
                aria-label="Chat Hub"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M2.25 12c0-4.556 4.143-8.25 9.25-8.25s9.25 3.694 9.25 8.25-4.143 8.25-9.25 8.25c-1.3 0-2.537-.244-3.662-.689-.37-.15-.782-.138-1.146.037l-2.38 1.164a.75.75 0 01-1.074-.702l.06-2.26a1.5 1.5 0 00-.442-1.077A7.853 7.853 0 012.25 12z" />
                </svg>
            </button>
            <div
                ref={panelRef}
                style={{
                    position: "fixed",
                    right: baseOffset.right,
                    bottom: baseOffset.bottom + 84,
                    zIndex: 9500,
                }}
                className={`transition-all duration-300 ${open
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="RealEstateX Chat Hub"
            >
                <div className="w-[400px] max-w-[92vw] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)] bg-white border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center">
                        <div className="font-semibold text-white mr-auto">Trợ lý RealEstateX</div>
                        <div className="flex p-1 bg-white/10 rounded-xl backdrop-blur-sm">
                            <button
                                onClick={() => setTab("ai")}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${tab === "ai"
                                    ? "bg-white text-indigo-700 font-semibold shadow"
                                    : "text-white/85 hover:bg-white/20"
                                    }`}
                            >
                                AI Chat
                            </button>
                            <button
                                onClick={() => setTab("support")}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${tab === "support"
                                    ? "bg-white text-purple-700 font-semibold shadow"
                                    : "text-white/85 hover:bg-white/20"
                                    }`}
                            >
                                Hỗ trợ
                            </button>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="ml-2 text-white/80 hover:text-white"
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="bg-white">
                        <div className={tab === "ai" ? "block" : "hidden"}>
                            <AIChatWidget mode="embedded" showHeader={false} size={size} />
                        </div>
                        <div className={tab === "support" ? "block" : "hidden"}>
                            <SupportChatWidget mode="embedded" showHeader={false} size={size} user={user} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
