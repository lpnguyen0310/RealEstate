import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    uid, cn, clamp, callAI, tryAutoConvertToSearch,
    parseSearchDSL, searchPropertiesAPI, buildSearchSummary,
} from "./aiUtils";

import ToggleButton from "./section/ToggleButton";
import Panel from "./section/Panel";
import Header from "./section/Header";
import Messages from "./section/Messages";
import QuickChips from "./section/QuickChips";
import InputBar from "./section/InputBar";


const PROJECT_NAME = "RealEstateX";
const SIZES = {
    xs: { btn: "h-11 w-11", panelW: "w-[320px]", panelB: "bottom-16", msgH: "h-[340px]" },
    sm: { btn: "h-12 w-12", panelW: "w-[360px]", panelB: "bottom-18", msgH: "h-[380px]" },
    md: { btn: "h-12 w-12", panelW: "w-[400px]", panelB: "bottom-20", msgH: "h-[420px]" },
};

export default function AIChatWidget({ size = "xs" }) {
    const SZ = SIZES[size] ?? SIZES.xs;

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const [open, setOpen] = useState(() => localStorage.getItem("aiw_open") === "1");
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [lastError, setLastError] = useState(null);

    const [messages, setMessages] = useState(() => {
        const raw = localStorage.getItem("aiw_msgs");
        if (raw) { try { return JSON.parse(raw); } catch { } }
        return [{ id: uid(), role: "assistant", ts: Date.now(), content: "Chào bạn! Có gì tôi có thể giúp bạn hôm nay không?" }];
    });

    // close-on-outside & ESC
    useEffect(() => {
        if (!open) return;
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
    }, [open]);

    useEffect(() => localStorage.setItem("aiw_open", open ? "1" : "0"), [open]);
    useEffect(() => localStorage.setItem("aiw_msgs", JSON.stringify(messages)), [messages]);

    useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [open, messages.length]);
    useEffect(() => {
        const ta = inputRef.current; if (!ta) return;
        ta.style.height = "auto"; ta.style.height = clamp(ta.scrollHeight, 36, 140) + "px";
    }, [input]);

    // === Chips: có text (command) và display (câu tự nhiên để hiển thị trong bubble) ===
    const quickChips = useMemo(() => ([
        {
            k: "r1",
            label: "Thuê Q.7 ≤10tr",
            text: "/search type=rent area=Q7 price<=10m beds>=2",
            display: "Tìm căn hộ cho thuê ở Quận 7, giá ≤ 10 triệu, tối thiểu 2 phòng ngủ",
        },
        {
            k: "b1",
            label: "Nhà phố Q.9",
            text: "/search type=buy area=ThuDuc price<=5ty areasize>=60m2",
            display: "Tôi muốn mua nhà phố (TP. Thủ Đức), diện tích ≥ 60m², giá ≤ 5 tỷ",
        },
        {
            k: "m1",
            label: "Vay 2 tỷ",
            text: "/mortgage price=2tỷ down=20% rate=9.5% term=20y",
            display: "Tính khoản vay 2 tỷ, trả trong 20 năm, lãi 9.5%, đặt cọc 20%",
        },
        {
            k: "e1",
            label: "Ước tính theo m²",
            text: "/estimate area=75m2 district=Q1 bedrooms=2 legal=Sổ hồng",
            display: "Ước tính giá căn 75m², Q1, 2 phòng ngủ, pháp lý Sổ hồng",
        },
    ]), []);

    // ================= handleSend: hỗ trợ hiển thị 'display' cho bubble user =================
    async function handleSend(text, opts = {}) {
        const original = (text ?? input).trim();
        if (!original) return;
        setInput("");

        // User bubble: hiện câu tự nhiên nếu có
        const shown = opts.display ?? original;
        const userMsg = { id: uid(), role: "user", content: shown, ts: Date.now() };
        setMessages((p) => [...p, userMsg]);
        setLastError(null);

        // Nội bộ: xử lý theo command hoặc auto-convert
        let content = original;
        const auto = tryAutoConvertToSearch(original);
        if (auto) content = auto;

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

    return (
        <>
            <ToggleButton refEl={toggleRef} open={open} onToggle={() => setOpen(v => !v)} sizeClass={SZ.btn} />
            <Panel refEl={panelRef} open={open} sizeClass={`${SZ.panelB} ${SZ.panelW}`}>
                <Header projectName={PROJECT_NAME} busy={busy} lastError={lastError} onClear={clearChat} />
                <Messages listRef={listRef} messages={messages} busy={busy} msgHClass={SZ.msgH} />
                <QuickChips
                    items={quickChips}
                    onPick={(text, display) => handleSend(text, { display })}
                />
                <InputBar inputRef={inputRef} value={input} setValue={setInput} busy={busy} onSend={() => handleSend()} />
                {lastError && (
                    <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">
                        {lastError}
                        <div className="mt-1 text-xs text-zinc-700">
                            Nếu báo `API key không hợp lệ`, kiểm tra key trong OpenRouter. Với production, khuyến nghị proxy qua backend để giấu key.
                        </div>
                    </div>
                )}
            </Panel>
        </>
    );
}
