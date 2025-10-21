import { useEffect, useMemo, useRef, useState } from "react";

/* ================== CONFIG ================== */
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY; // key từ .env.local
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-3.5-turbo";
const PROJECT_NAME = "RealEstateX";

// Preset kích thước
const SIZES = {
    xs: { btn: "h-11 w-11", panelW: "w-[320px]", panelB: "bottom-16", msgH: "h-[340px]" },
    sm: { btn: "h-12 w-12", panelW: "w-[360px]", panelB: "bottom-18", msgH: "h-[380px]" },
    md: { btn: "h-12 w-12", panelW: "w-[400px]", panelB: "bottom-20", msgH: "h-[420px]" },
};

const uid = () => Math.random().toString(36).slice(2);
const cn = (...xs) => xs.filter(Boolean).join(" ");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/** timeAgo tiếng Việt, mềm mại hơn */
function timeAgoVi(ts) {
    const s = Math.max(1, Math.floor((Date.now() - (ts || 0)) / 1000));
    if (s < 60) return `${s}s trước`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}p trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}g trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    // fallback dạng dd/mm hh:mm
    const dt = new Date(ts);
    return dt.toLocaleString("vi-VN", { hour12: false });
}

/* ================== Call OpenRouter ================== */
async function callAI(messages) {
    if (!OPENROUTER_KEY) return "⚠️ Thiếu VITE_OPENROUTER_KEY trong .env.local";

    const sys = {
        role: "system",
        content:
            "Bạn là trợ lý bất động sản nói tiếng Việt, văn phong gọn, dùng bullet khi phù hợp. " +
            "Hỗ trợ: /search (lọc tin), /mortgage (tính vay), /estimate (định giá), /amenities (tiện ích).",
    };

    const payload = {
        model: MODEL,
        messages: [sys].concat(messages.map((m) => ({ role: m.role, content: m.content }))),
        temperature: 0.6,
    };

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": window.location.origin, // bắt buộc cho OpenRouter
                "X-Title": PROJECT_NAME,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const t = await res.text();
            return `⚠️ OpenRouter ${res.status}: ${t.slice(0, 160)}`;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || "(empty)";
    } catch (err) {
        console.error(err);
        return "⚠️ Không thể gọi OpenRouter (mạng/CORS).";
    }
}

/* ================== WIDGET ================== */
export default function AIChatWidget({ user, size = "xs" }) {
    const SZ = SIZES[size] ?? SIZES.xs;
    const chipsRef = useRef(null);
    const scrollChips = (dx) => chipsRef.current?.scrollBy({ left: dx, behavior: "smooth" });
    const [open, setOpen] = useState(() => localStorage.getItem("aiw_open") === "1");
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [lastError, setLastError] = useState(null);
    const [messages, setMessages] = useState(() => {
        const raw = localStorage.getItem("aiw_msgs");
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch { }
        }
        return [
            {
                id: uid(),
                role: "assistant",
                ts: Date.now(),
                content: `Chào bạn! Có gì tôi có thể giúp bạn hôm nay không?`,
            },
        ];
    });
    const panelRef = useRef(null);
    const toggleRef = useRef(null);

    // Đóng khi bấm ra ngoài
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            const inPanel = panelRef.current?.contains(e.target);
            const inToggle = toggleRef.current?.contains(e.target);
            if (!inPanel && !inToggle) setOpen(false);
        };
        const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };

        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown, { passive: true });
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => localStorage.setItem("aiw_open", open ? "1" : "0"), [open]);
    useEffect(() => localStorage.setItem("aiw_msgs", JSON.stringify(messages)), [messages]);

    // Auto scroll xuống đáy khi có tin mới
    useEffect(() => {
        if (!open) return;
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [open, messages.length]);

    // Auto-resize textarea (1..6 rows)
    useEffect(() => {
        const ta = inputRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = clamp(ta.scrollHeight, 36, 140) + "px";
    }, [input]);

    const quickChips = useMemo(
        () => [
            { k: "r1", label: "Thuê Q.7 ≤10tr", text: "/search type=rent area=Q7 price<=10m beds>=2" },
            { k: "b1", label: "Nhà phố Q.9", text: "/search type=buy area=ThuDuc property=nhàphố budget<=5tỷ" },
            { k: "m1", label: "Vay 2 tỷ", text: "/mortgage price=2tỷ down=20% rate=9.5% term=20y" },
            { k: "e1", label: "Ước tính theo m²", text: "/estimate area=75m2 district=Q1 bedrooms=2 legal=Sổ hồng" },
        ],
        []
    );

    async function handleSend(text) {
        const content = (text ?? input).trim();
        if (!content) return;
        setInput("");

        const userMsg = { id: uid(), role: "user", content, ts: Date.now() };
        setMessages((p) => [...p, userMsg]);
        setLastError(null);

        if (/^\/help/i.test(content)) {
            setMessages((p) => [
                ...p,
                {
                    id: uid(),
                    role: "assistant",
                    ts: Date.now(),
                    content:
                        "Lệnh:\n• /search type=rent|buy area=Q7 price<=10m beds>=2\n• /mortgage price=2tỷ down=20% rate=9.5% term=20y\n• /estimate area=70m2 district=Q7 bedrooms=2 legal=Sổ hồng\n• /amenities near=Thủ Đức within=1km",
                },
            ]);
            return;
        }

        setBusy(true);
        const lastN = (messages || []).concat(userMsg).slice(-12);
        const reply = await callAI(lastN);
        setBusy(false);

        if (typeof reply === "string" && reply.startsWith("⚠️")) setLastError(reply);
        setMessages((p) => [...p, { id: uid(), role: "assistant", content: reply, ts: Date.now() }]);
    }

    function clearChat() {
        if (!confirm("Xóa hội thoại hiện tại?")) return;
        setMessages([{ id: uid(), role: "assistant", ts: Date.now(), content: `Đã tạo hội thoại mới cho ${PROJECT_NAME}.` }]);
        setLastError(null);
    }

    return (
        <>
            {/* Toggle */}
            <button
                ref={toggleRef}
                aria-label={open ? "Đóng chat" : "Mở chat"}
                onClick={() => setOpen(!open)}
                className={cn(
                    `fixed bottom-4 right-4 z-50 ${SZ.btn} rounded-2xl`,
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

            {/* Panel */}
            <div
                ref={panelRef}
                className={cn(
                    `fixed ${SZ.panelB} right-4 z-40 ${SZ.panelW} max-w-[92vw] transition-all duration-300`,
                    open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}
            >
                <div
                    className={cn(
                        "overflow-hidden rounded-2xl backdrop-blur-xl",
                        "bg-white/90 ring-1 ring-black/10 shadow-2xl flex flex-col"
                    )}
                >
                    {/* Header */}
                    <div className="relative px-3 py-2 text-white">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600" />
                        <div className="relative flex items-center gap-2">
                            <span className="h-7 w-7 rounded-xl bg-white/20 grid place-items-center text-sm shadow-inner">🏠</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate">Trợ lý BĐS • {PROJECT_NAME}</div>
                                <div className="text-[10px] opacity-90">Giá • Vay • Tiện ích • Tìm tin</div>
                            </div>
                            <span
                                className={cn(
                                    "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border",
                                    busy
                                        ? "bg-yellow-50/90 text-yellow-900 border-yellow-200"
                                        : "bg-emerald-50/90 text-emerald-900 border-emerald-200"
                                )}
                            >
                                {busy ? "Đang trả lời" : lastError ? "Lỗi" : "Sẵn sàng"}
                            </span>
                            <button onClick={clearChat} title="Xóa hội thoại" className="opacity-90 hover:opacity-100 ml-1">
                                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m-9 0h10" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={listRef}
                        className={cn(
                            `${SZ.msgH} overflow-y-auto px-3 py-3`,
                            "bg-gradient-to-b from-zinc-50 via-white to-white"
                        )}
                    >
                        {messages.map((m, i) => (
                            <Bubble key={m.id} msg={m} prev={messages[i - 1]} />
                        ))}
                        {busy && <Typing />}
                    </div>

                    {/* Chips */}
                    <div className="relative p-2 border-t border-black/5 bg-white/85 backdrop-blur-md">
                        <div
                            ref={chipsRef}
                            className="flex gap-1.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-px-2 scrollbar-none"
                            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
                        >
                            {quickChips.map((q) => (
                                <button
                                    key={q.k}
                                    onClick={() => handleSend(q.text)}
                                    className="shrink-0 snap-start text-[11px] whitespace-nowrap rounded-full px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-black/5 shadow-sm"
                                >
                                    💡 {q.label}
                                </button>
                            ))}
                        </div>

                        {/* Nút nảy trái/phải (desktop) – optional */}
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

                    {/* Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-end gap-1.5 p-2 border-t border-black/5 bg-white/90 backdrop-blur-md"
                    >
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập câu hỏi hoặc /help…"
                                className="w-full resize-none rounded-2xl border border-black/10 px-3 py-2 text-[13px] leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />
                            <div className="pointer-events-none absolute right-2 bottom-2 text-[10px] text-zinc-400">
                                {input.trim().length ? `${input.length} ký tự` : ""}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || busy}
                            className={cn(
                                "shrink-0 rounded-2xl px-3 py-2 text-[13px] font-medium shadow-md transition",
                                busy || !input.trim()
                                    ? "bg-zinc-200 text-zinc-400"
                                    : "bg-indigo-600 text-white hover:brightness-110"
                            )}
                            title="Gửi"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-4 7 4 7-14-7z" />
                            </svg>
                        </button>
                    </form>

                    {/* Error / Help footer */}
                    {lastError && (
                        <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">
                            {lastError}
                            <div className="mt-1 text-xs text-zinc-700">
                                Nếu báo `API key không hợp lệ`, kiểm tra key trong OpenRouter. Với production, khuyến nghị proxy qua backend để giấu key.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ============= Subcomponents ============= */
/** Bubble căn thẳng hàng (avatar + tin + thời gian), bo góc nối khi cùng người gửi */
function Bubble({ msg, prev }) {
    const isUser = msg.role === "user";
    const sameAsPrev = prev && prev.role === msg.role;

    return (
        <div className={cn("mb-2 flex", isUser ? "justify-end" : "justify-start")}>
            {/* Avatar (ẩn khi cùng người gửi liên tiếp) */}
            {!isUser && (
                <div className={cn("mr-2 transition-all", sameAsPrev ? "opacity-0 w-6" : "opacity-100 w-6")}>
                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white grid place-items-center text-[11px] shadow-inner">
                        🏠
                    </div>
                </div>
            )}

            <div className={cn("max-w-[84%] flex flex-col items-start", isUser && "items-end")}>
                <div
                    className={cn(
                        "px-3 py-2 text-[13px] leading-5 whitespace-pre-wrap shadow-sm",
                        isUser
                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm"
                            : "bg-white text-zinc-900 border border-black/5 rounded-2xl rounded-bl-sm"
                    )}
                    style={{
                        borderTopLeftRadius: !isUser && sameAsPrev ? "8px" : "16px",
                        borderTopRightRadius: isUser && sameAsPrev ? "8px" : "16px",
                    }}
                >
                    {msg.content}
                </div>
                {/* Thời gian nằm dưới, canh theo bubble */}
                <div
                    className={cn(
                        "mt-1 text-[10px] text-zinc-400",
                        isUser ? "text-right pr-1" : "text-left pl-1"
                    )}
                >
                    {timeAgoVi(msg.ts)}
                </div>
            </div>

            {/* Avatar bên phải cho user (ẩn khi cùng người gửi) */}
            {isUser && (
                <div className={cn("ml-2 transition-all", sameAsPrev ? "opacity-0 w-6" : "opacity-100 w-6")}>
                    <div className="h-6 w-6 rounded-full bg-fuchsia-600 text-white grid place-items-center text-[11px] shadow-inner">
                        🙋
                    </div>
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
