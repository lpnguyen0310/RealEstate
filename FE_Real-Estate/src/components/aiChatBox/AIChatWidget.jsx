// src/components/ai/AIChatWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import PropertyMiniCard from "./PropertyMiniCard";

/* ================== CONFIG ================== */
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;
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
    const dt = new Date(ts);
    return dt.toLocaleString("vi-VN", { hour12: false });
}

/* ================== Call OpenRouter (đã sanitize) ================== */
async function callAI(historyMsgs) {
    if (!OPENROUTER_KEY) return "⚠️ Thiếu VITE_OPENROUTER_KEY trong .env.local";

    const sys = {
        role: "system",
        content:
            "Bạn là trợ lý bất động sản nói tiếng Việt, văn phong gọn, dùng bullet khi phù hợp. " +
            "Hỗ trợ: /search (lọc tin), /mortgage (tính vay), /estimate (định giá), /amenities (tiện ích).",
    };

    // Chỉ gửi những message có content là string
    const cleaned = (historyMsgs || [])
        .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

    const payload = { model: MODEL, messages: [sys, ...cleaned], temperature: 0.6 };

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENROUTER_KEY}`,
                "HTTP-Referer": window.location.origin,
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

/* ============== Helpers cho /search DSL ============== */

// "10m", "2tỷ", "150k", "12000000" -> number (VND)
function parseMoneyVN(s) {
    if (!s) return null;
    const raw = s.toString().trim().toLowerCase();
    const x = raw.replace(/\./g, "").replace(/,/g, "");
    if (x.endsWith("k")) return Number(x.replace("k", "")) * 1_000;
    if (/(ng|nghìn|nghin)$/.test(x)) return Number(x.replace(/[^\d]/g, "")) * 1_000;
    if (x.endsWith("m")) return Number(x.replace("m", "")) * 1_000_000;
    if (x.endsWith("tr")) return Number(x.replace("tr", "")) * 1_000_000;
    if (/(ty|tỷ|tỷ)$/.test(x)) return Number(x.replace(/[^\d]/g, "")) * 1_000_000_000;
    const n = Number(x.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
}

// "75m2" | "75" -> 75 (m²)
function parseArea(s) {
    if (!s) return null;
    const n = Number(String(s).toLowerCase().replace(/m2|m²/g, "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
}

// Parse DSL "/search key=val key2<=val ..." -> params backend
function parseSearchDSL(text) {
    const m = text.trim().match(/^\/search\s+(.+)$/i);
    if (!m) return null;

    const tokens = m[1]
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const params = {};

    for (const t of tokens) {
        const rel = t.match(/^([^=<>:]+)\s*(<=|>=|=|:)\s*(.+)$/);
        if (!rel) continue;
        const key = rel[1].toLowerCase();
        const op = rel[2];
        const val = rel[3];

        if (key === "type") {
            params.type = val.toLowerCase().includes("rent") ? "rent" : "sell";
        } else if (key === "category") {
            params.category = val; // slug
        } else if (key === "keyword" || key === "q") {
            params.keyword = val;
        } else if (key === "area") {
            params.keyword = (params.keyword ? params.keyword + " " : "") + val;
        } else if (key === "price") {
            const v = parseMoneyVN(val);
            if (v != null) {
                if (op === "<=") params.priceTo = v;
                else if (op === ">=") params.priceFrom = v;
                else params.priceFrom = params.priceTo = v;
            }
        } else if (key === "beds" || key === "bedrooms") {
            const n = Number(val.replace(/[^\d]/g, ""));
            if (Number.isFinite(n)) {
                params.keyword = (params.keyword ? params.keyword + " " : "") + `${n} phòng ngủ`;
            }
        } else if (key === "areasize" || key === "size" || key === "area") {
            const a = parseArea(val);
            if (a != null) {
                if (op === "<=") params.areaTo = a;
                else if (op === ">=") params.areaFrom = a;
                else params.areaFrom = params.areaTo = a;
            }
        }
    }

    return params;
}

// ép số an toàn
function toNum(v) {
    if (v == null) return null;
    const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
    return Number.isFinite(n) ? n : null;
}

// Map BE -> UI card thống nhất với public list mapper
function mapPublicPropertyToCard(p) {
    if (!p) return {};
    return {
        id: p.id,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        title: p.title,
        description: p.description,

        price: toNum(p.price),
        pricePerM2: toNum(p.pricePerM2),
        postedAt: p.postedAt,
        photos: p.photos,

        addressMain: p.addressFull || p.addressShort || "",
        addressShort: p.addressShort || "",
        addressFull: p.addressFull || "",

        area: p.area,
        bed: p.bed,
        bath: p.bath,

        agent: p.agent,
        type: p.type,
        category: p.category,

        listingType: p.listing_type,
    };
}

// Gọi API /properties với params đã parse
async function searchPropertiesAPI(params) {
    const res = await api.get("/properties", { params });
    const page = res?.data?.data ?? res?.data;
    const arr = Array.isArray(page?.content) ? page.content : [];
    return {
        items: arr.map(mapPublicPropertyToCard),
        total: page?.totalElements ?? arr.length,
        page: page?.number ?? 0,
        pages: page?.totalPages ?? 1,
    };
}

function buildSearchSummary({ total, page, pages, shownCount /*, params*/ }) {
    const pn = (n) => new Intl.NumberFormat("vi-VN").format(n);
    const pageText = pages > 1 ? ` (trang ${page + 1}/${pages})` : "";

    if (!total || total === 0) {
        return "Chưa thấy tin nào khớp tiêu chí 😥. Bạn thử:\n• Đổi từ khóa (ví dụ: tên đường/địa danh gần đó)\n• Nới khoảng giá hoặc diện tích\n• Chọn lại loại tin (mua/thuê)";
    }
    if (total === 1) {
        return "Mình tìm được 1 tin đúng yêu cầu, bạn xem ngay bên dưới nhé.";
    }
    const head = `Mình tìm được ${pn(total)} tin phù hợp${pageText}.`;
    const tail = shownCount && shownCount < total ? ` Mình hiển thị ${shownCount} tin đầu tiên trước, cần mình tải thêm không?` : "";
    return head + tail;
}

/* ============== Natural-language → /search auto-convert ============== */
function tryAutoConvertToSearch(nlText) {
    if (!nlText) return null;
    const text = nlText.trim();

    // Chỉ auto khi câu bắt đầu bằng các động từ yêu cầu
    const verbRe = /^(tìm|cho tôi xem|hiển thị|tôi muốn xem|liệt kê)\b/i;
    if (!verbRe.test(text)) return null;

    // Loại bỏ các từ đệm
    let body = text
        .replace(verbRe, "")
        .replace(/\b(các|những|bất động sản|tin|nhà|căn hộ|chung cư|bài đăng)\b/gi, "")
        .trim();

    // type = rent|sell
    let type = "";
    if (/\bthuê\b/i.test(body)) type = "type=rent";
    if (/\b(mua|bán)\b/i.test(body)) type = "type=buy";

    // price: "dưới 10 tỷ", ...
    const priceRe = /(dưới|<=|<|trên|>=|>|từ|khoảng)\s*(\d+[.,]?\d*)\s*(tỷ|ty|triệu|tr|nghìn|nghin|k)?/i;
    let priceClause = "";
    const pm = body.match(priceRe);
    if (pm) {
        const dir = pm[1].toLowerCase();
        const val = pm[2];
        const unit = pm[3] || "";
        let sign = "=";
        if (dir.includes("dưới") || dir === "<=" || dir === "<" || dir.includes("khoảng")) sign = "<=";
        if (dir.includes("trên") || dir === ">=" || dir === ">" || dir.includes("từ")) sign = sign === "<=" ? "<=" : ">=";
        priceClause = ` price${sign}${val}${unit}`;
        body = body.replace(priceRe, "").trim();
    }

    // keyword theo "ở|tại" …, nếu không có thì lấy phần còn lại
    let keyword = "";
    const locRe = /(ở|tại)\s+(.+)$/i;
    const lm = body.match(locRe);
    if (lm && lm[2]) {
        keyword = lm[2].trim();
    } else {
        keyword = body
            .replace(/\b(ở|tại|quận|huyện|thành phố|tp\.?)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
    }
    if (keyword) keyword = keyword.replace(/[,.;\-–—]+$/, "").trim();

    const parts = ["/search"];
    if (type) parts.push(type);
    if (keyword) parts.push(`keyword=${keyword}`);
    if (priceClause) parts.push(priceClause.trim());
    const generated = parts.join(" ");
    return generated.length > "/search".length ? generated : null;
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
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // Đóng khi bấm ra ngoài
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            const inPanel = panelRef.current?.contains(e.target);
            const inToggle = toggleRef.current?.contains(e.target);
            if (!inPanel && !inToggle) setOpen(false);
        };
        const onEsc = (e) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown, { passive: true });
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

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
            { k: "b1", label: "Nhà phố Q.9", text: "/search type=buy area=ThuDuc price<=5ty areasize>=60m2" },
            { k: "m1", label: "Vay 2 tỷ", text: "/mortgage price=2tỷ down=20% rate=9.5% term=20y" },
            { k: "e1", label: "Ước tính theo m²", text: "/estimate area=75m2 district=Q1 bedrooms=2 legal=Sổ hồng" },
        ],
        []
    );

    async function handleSend(text) {
        const original = (text ?? input).trim();
        if (!original) return;
        setInput("");

        // Push message người dùng
        const userMsg = { id: uid(), role: "user", content: original, ts: Date.now() };
        setMessages((p) => [...p, userMsg]);
        setLastError(null);

        // Tự động hiểu ngôn ngữ tự nhiên → /search
        let content = original;
        const auto = tryAutoConvertToSearch(original);
        if (auto) content = auto;

        // /help
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

        // /search -> gọi API và render cards
        if (/^\/search\s+/i.test(content)) {
            const parsed = parseSearchDSL(content);
            if (!parsed) {
                setMessages((p) => [
                    ...p,
                    { id: uid(), role: "assistant", ts: Date.now(), content: "Cú pháp chưa đúng. Thử `/help` nhé." },
                ]);
                return;
            }

            // hiển thị "đang tìm"
            const pendingId = uid();
            setMessages((p) => [
                ...p,
                { id: pendingId, role: "assistant", ts: Date.now(), content: "Đang tìm tin phù hợp…" },
            ]);

            try {
                setBusy(true);
                const { items, total, page, pages } = await searchPropertiesAPI(parsed);
                setBusy(false);
                const shown = Math.min(8, items.length); // số card render
                const summary = buildSearchSummary({
                    total,
                    page,
                    pages,
                    shownCount: shown,
                    params: parsed,
                });
                // thay message pending bằng kết quả cards
                setMessages((p) => {
                    const next = p.slice();
                    const idx = next.findIndex((m) => m.id === pendingId);
                    if (idx !== -1) next.splice(idx, 1);
                    return [
                        ...next,
                        {
                            id: uid(),
                            role: "assistant",
                            ts: Date.now(),
                            content: summary,
                        },
                        {
                            id: uid(),
                            role: "assistant",
                            ts: Date.now(),
                            kind: "cards",
                            cards: items.slice(0, shown),
                        },
                    ];
                });
            } catch (err) {
                setBusy(false);
                setMessages((p) => [
                    ...p,
                    { id: uid(), role: "assistant", ts: Date.now(), content: "⚠️ Lỗi khi tìm kiếm tin." },
                ]);
            }
            return;
        }

        // fallback: gọi AI như cũ (đã sanitize)
        setBusy(true);
        const lastN = (messages || []).concat(userMsg).slice(-12);
        const reply = await callAI(lastN);
        setBusy(false);

        if (typeof reply === "string" && reply.startsWith("⚠️")) setLastError(reply);
        setMessages((p) => [...p, { id: uid(), role: "assistant", content: reply, ts: Date.now() }]);
    }

    function clearChat() {
        if (!confirm("Xóa hội thoại hiện tại?")) return;
        setMessages([
            { id: uid(), role: "assistant", ts: Date.now(), content: `Đã tạo hội thoại mới cho ${PROJECT_NAME}.` },
        ]);
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
                <div className={cn("overflow-hidden rounded-2xl backdrop-blur-xl", "bg-white/90 ring-1 ring-black/10 shadow-2xl flex flex-col")}>
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
                                    busy ? "bg-yellow-50/90 text-yellow-900 border-yellow-200" : "bg-emerald-50/90 text-emerald-900 border-emerald-200"
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
                    <div ref={listRef} className={cn(`${SZ.msgH} overflow-y-auto px-3 py-3`, "bg-gradient-to-b from-zinc-50 via-white to-white")}>
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
                                placeholder="Nhập câu hỏi tự nhiên (VD: 'Tìm căn hộ ở The Sun Avenue dưới 10 tỷ') hoặc /help…"
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
                                busy || !input.trim() ? "bg-zinc-200 text-zinc-400" : "bg-indigo-600 text-white hover:brightness-110"
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
function Bubble({ msg, prev }) {
    const isUser = msg.role === "user";
    const sameAsPrev = prev && prev.role === msg.role;

    const contentView =
        msg.kind === "cards" ? (
            // ====== KHUNG SCROLLER NGANG CỐ ĐỊNH (đã fix) ======
            <div className="w-full max-w-full overflow-hidden">
                 <div
                    className="flex gap-[70px] overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-thin pb-1 -mx-[5px] px-[5px]"
                    style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
                >
                    {Array.isArray(msg.cards) && msg.cards.length ? (
                        msg.cards.map((it) => (
                            // Mỗi card có độ rộng cố định & không co giãn
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

            {/* THÊM min-w-0 để con không làm nở rộng bubble */}
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
