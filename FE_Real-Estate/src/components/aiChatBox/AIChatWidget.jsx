// src/components/aiChatBox/AIChatWidget.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    uid, clamp, callAI, tryAutoConvertToSearch,
    parseSearchDSL, searchPropertiesAPI, buildSearchSummary,
} from "./aiUtils";
import Header from "./section/Header";
import Messages from "./section/Messages";
import QuickChips from "./section/QuickChips";
import InputBar from "./section/InputBar";

const PROJECT_NAME = "RealEstateX";
const SIZES = {
    xs: { btn: "h-11 w-11", panelW: "w-[320px]", msgH: "h-[340px]" },
    sm: { btn: "h-12 w-12", panelW: "w-[360px]", msgH: "h-[380px]" },
    md: { btn: "h-12 w-12", panelW: "w-[400px]", msgH: "h-[420px]" },
};

export default function AIChatWidget({
    size = "xs",
    mode = "standalone",        // NEW: "standalone" | "embedded"
    showHeader = true,          // NEW: ẩn header khi nhúng vào Hub
    offset = { right: 24, bottom: 24 }, // vẫn giữ để backward-compat
    controlledOpen,             // optional (standalone)
    hideFab = false,            // optional (standalone)
    onOpenChange,
}) {
    const SZ = SIZES[size] ?? SIZES.xs;

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const [openState, setOpenState] = useState(() => {
        if (typeof controlledOpen === "boolean") return controlledOpen;
        return localStorage.getItem("aiw_open") === "1";
    });
    const open = mode === "embedded"
        ? true
        : (typeof controlledOpen === "boolean" ? controlledOpen : openState);

    const setOpen = (v) => {
        if (mode === "embedded") return; // Hub điều khiển
        const next = typeof v === "function" ? v(open) : v;
        if (typeof controlledOpen !== "boolean") {
            setOpenState(next);
            localStorage.setItem("aiw_open", next ? "1" : "0");
        }
        onOpenChange?.(next);
    };

    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [lastError, setLastError] = useState(null);
    const [messages, setMessages] = useState(() => {
        const raw = localStorage.getItem("aiw_msgs");
        if (raw) { try { return JSON.parse(raw); } catch { } }
        return [{ id: uid(), role: "assistant", ts: Date.now(), content: "Chào bạn! Có gì tôi có thể giúp bạn hôm nay không?" }];
    });

    // only apply outside-click/esc in standalone + open
    useEffect(() => {
        if (mode === "embedded" || !open) return;
        const onDown = (e) => {
            const inPanel = panelRef.current?.contains(e.target);
            const inToggle = toggleRef.current?.contains(e.target);
            if (!inPanel && !inToggle) setOpen(false);
        };
        const onEsc = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown, { passive: true });
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open, mode]);

    useEffect(() => localStorage.setItem("aiw_msgs", JSON.stringify(messages)), [messages]);

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length]);

    useEffect(() => {
        const ta = inputRef.current; if (!ta) return;
        ta.style.height = "auto"; ta.style.height = Math.min(140, Math.max(36, ta.scrollHeight)) + "px";
    }, [input]);

    const quickChips = useMemo(() => ([
        {
            k: "r1", label: "Thuê Q.7 ≤10tr", text: "/search type=rent area=Q7 price<=10m beds>=2",
            display: "Tìm căn hộ cho thuê ở Quận 7, giá ≤ 10 triệu, tối thiểu 2 phòng ngủ"
        },
        {
            k: "b1", label: "Nhà phố Q.9", text: "/search type=buy area=ThuDuc price<=5ty areasize>=60m2",
            display: "Tôi muốn mua nhà phố (TP. Thủ Đức), diện tích ≥ 60m², giá ≤ 5 tỷ"
        },
        {
            k: "m1", label: "Vay 2 tỷ", text: "/mortgage price=2tỷ down=20% rate=9.5% term=20y",
            display: "Tính khoản vay 2 tỷ, trả trong 20 năm, lãi 9.5%, đặt cọc 20%"
        },
        {
            k: "e1", label: "Ước tính theo m²", text: "/estimate area=75m2 district=Q1 bedrooms=2 legal=Sổ hồng",
            display: "Ước tính giá căn 75m², Q1, 2 phòng ngủ, pháp lý Sổ hồng"
        },
    ]), []);

    async function handleSend(text, opts = {}) {
        const original = (text ?? input).trim();
        if (!original) return;
        setInput("");
        const shown = opts.display ?? original;
        const userMsg = { id: uid(), role: "user", content: shown, ts: Date.now() };
        setMessages((p) => [...p, userMsg]);
        setLastError(null);

        let content = tryAutoConvertToSearch(original) || original;

        if (/^\/help/i.test(content)) {
            setMessages((p) => [...p, {
                id: uid(), role: "assistant", ts: Date.now(),
                content: "Lệnh:\n• /search type=rent|buy area=Q7 price<=10m beds>=2\n• /mortgage price=2tỷ down=20% rate=9.5% term=20y\n• /estimate area=70m2 district=Q7 bedrooms=2 legal=Sổ hồng\n• /amenities near=Thủ Đức within=1km",
            }]);
            return;
        }

        if (/^\/search\s+/i.test(content)) {
            const parsed = parseSearchDSL(content);
            if (!parsed) {
                setMessages((p) => [...p, { id: uid(), role: "assistant", ts: Date.now(), content: "Cú pháp chưa đúng. Thử `/help` nhé." }]);
                return;
            }
            const pendingId = uid();
            setMessages((p) => [...p, { id: pendingId, role: "assistant", ts: Date.now(), content: "Đang tìm tin phù hợp…" }]);
            try {
                setBusy(true);
                const { items, total, page, pages } = await searchPropertiesAPI(parsed);
                setBusy(false);
                const shownCount = Math.min(8, items.length);
                const summary = buildSearchSummary({ total, page, pages, shownCount });
                setMessages((p) => {
                    const next = p.slice();
                    const idx = next.findIndex((m) => m.id === pendingId);
                    if (idx !== -1) next.splice(idx, 1);
                    return [
                        ...next,
                        { id: uid(), role: "assistant", ts: Date.now(), content: summary },
                        { id: uid(), role: "assistant", ts: Date.now(), kind: "cards", cards: items.slice(0, shownCount) },
                    ];
                });
            } catch {
                setBusy(false);
                setMessages((p) => [...p, { id: uid(), role: "assistant", ts: Date.now(), content: "⚠️ Lỗi khi tìm kiếm tin." }]);
            }
            return;
        }

        setBusy(true);
        const lastN = (messages || []).concat(userMsg).slice(-12);
        const reply = await callAI(lastN);
        setBusy(false);
        if (typeof reply === "string" && reply.startsWith("⚠️")) setLastError(reply);
        setMessages((p) => [...p, { id: uid(), role: "assistant", content: reply, ts: Date.now() }]);
    }

    const clearChat = () => {
        if (!confirm("Xóa hội thoại hiện tại?")) return;
        setMessages([{ id: uid(), role: "assistant", ts: Date.now(), content: `Đã tạo hội thoại mới cho ${PROJECT_NAME}.` }]);
        setLastError(null);
    };

    // ====== RENDER ======
    if (mode === "embedded") {
        // ❗ Không FAB, không fixed panel – chỉ phần “nội dung” để Hub nhúng
        return (
            <div className="w-[400px] bg-white">
                {showHeader && (
                    <Header projectName={PROJECT_NAME} busy={busy} lastError={lastError} onClear={clearChat} />
                )}
                <Messages listRef={listRef} messages={messages} busy={busy} msgHClass={SZ.msgH} />
                <QuickChips items={quickChips} onPick={(t, d) => handleSend(t, { display: d })} />
                <InputBar inputRef={inputRef} value={input} setValue={setInput} busy={busy} onSend={() => handleSend()} />
            </div>
        );
    }

    // Standalone cũ (nếu bạn vẫn dùng ở nơi khác)
    return (
        <>
            {!hideFab && (
                <button
                    ref={toggleRef}
                    onClick={() => setOpen(v => !v)}
                    style={{ position: "fixed", right: offset.right, bottom: offset.bottom, zIndex: 10000 }}
                    className={`${SZ.btn} grid place-items-center rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700`}
                    aria-label="AI Assistant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.25 12c0-4.556 4.143-8.25 9.25-8.25s9.25 3.694 9.25 8.25-4.143 8.25-9.25 8.25c-1.3 0-2.537-.244-3.662-.689-.37-.15-.782-.138-1.146.037l-2.38 1.164a.75.75 0 01-1.074-.702l.06-2.26a1.5 1.5 0 00-.442-1.077A7.853 7.853 0 012.25 12z" />
                    </svg>
                </button>
            )}

            <div
                ref={panelRef}
                style={{ position: "fixed", right: offset.right, bottom: offset.bottom + 72, zIndex: 9500 }}
                className={`${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"} transition-all duration-200`}
            >
                <div className={`bg-white ${SZ.panelW} rounded-2xl border border-gray-100 shadow-[0_8px_36px_rgba(13,47,97,0.08)] overflow-hidden`}>
                    <Header projectName={PROJECT_NAME} busy={busy} lastError={lastError} onClear={clearChat} />
                    <Messages listRef={listRef} messages={messages} busy={busy} msgHClass={SZ.msgH} />
                    <QuickChips items={quickChips} onPick={(t, d) => handleSend(t, { display: d })} />
                    <InputBar inputRef={inputRef} value={input} setValue={setInput} busy={busy} onSend={() => handleSend()} />
                </div>
            </div>
        </>
    );
}
