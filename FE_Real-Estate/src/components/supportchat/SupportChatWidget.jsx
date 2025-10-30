import React, { useEffect, useMemo, useRef, useState } from "react";

const fmtTime = (ts) => new Date(ts).toLocaleString("vi-VN");
const uid = () => Math.random().toString(36).slice(2, 10);

async function apiCreateConversation(payload) {
    // TODO: replace with your real axios call
    await new Promise((r) => setTimeout(r, 800));
    return { id: "cv_" + uid() };
}
async function apiFetchMessages(conversationId) {
    // TODO: replace with your real axios call
    await new Promise((r) => setTimeout(r, 300));
    return [];
}
async function apiSendMessage(conversationId, content) {
    // TODO: replace with your real axios call
    await new Promise((r) => setTimeout(r, 200));
    return { id: uid(), role: "user", content, ts: Date.now() };
}

// ====== Core widget ======
export default function SupportChatWidget({ user, size = "md" }) {
    const sizes = {
        xs: { btn: "h-11 w-11", panelW: "w-[320px]", panelB: "bottom-16", msgH: "h-[340px]" },
        sm: { btn: "h-12 w-12", panelW: "w-[360px]", panelB: "bottom-18", msgH: "h-[380px]" },
        md: { btn: "h-12 w-12", panelW: "w-[400px]", panelB: "bottom-20", msgH: "h-[420px]" },
    };
    const SZ = sizes[size] ?? sizes.md;

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const [open, setOpen] = useState(() => localStorage.getItem("support_open") === "1");
    const [step, setStep] = useState(() => localStorage.getItem("support_step") || "form");
    const [convId, setConvId] = useState(() => localStorage.getItem("support_cid") || null);

    const [form, setForm] = useState(() => {
        const raw = localStorage.getItem("support_form");
        if (raw) try { return JSON.parse(raw); } catch { }
        return { fullName: user?.fullName || "", phone: "", email: user?.email || "" };
    });
    const [errors, setErrors] = useState({});

    const [busy, setBusy] = useState(false);
    const [messages, setMessages] = useState(() => {
        const raw = localStorage.getItem("support_msgs");
        if (raw) try { return JSON.parse(raw); } catch { }
        return [];
    });
    const [input, setInput] = useState("");

    // Persist
    useEffect(() => localStorage.setItem("support_open", open ? "1" : "0"), [open]);
    useEffect(() => localStorage.setItem("support_step", step), [step]);
    useEffect(() => localStorage.setItem("support_cid", convId ?? ""), [convId]);
    useEffect(() => localStorage.setItem("support_form", JSON.stringify(form)), [form]);
    useEffect(() => localStorage.setItem("support_msgs", JSON.stringify(messages)), [messages]);

    // Close on outside + ESC
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

    // Auto scroll
    useEffect(() => {
        if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [open, messages.length]);

    // ===== Actions =====
    function validate() {
        const e = {};
        if (!form.fullName?.trim()) e.fullName = "Bắt buộc";
        if (!form.phone?.trim()) e.phone = "Bắt buộc";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function startChat() {
        if (!validate()) return;
        setBusy(true);
        setStep("initializing");

        try {
            const { id } = await apiCreateConversation(form);
            setConvId(id);

            // Show "thank you" system message similar to screenshot
            const thanks = `Cảm ơn bạn đã cung cấp thông tin\n${form.fullName} | ${form.phone}${form.email ? ` | ${form.email}` : ""}`;
            const nowLine = new Date().toLocaleDateString("vi-VN");
            setMessages([
                { id: uid(), role: "system", ts: Date.now(), content: nowLine },
                { id: uid(), role: "system", ts: Date.now(), content: thanks },
            ]);

            // Fetch history (if any)
            const hist = await apiFetchMessages(id);
            if (hist?.length) setMessages((p) => [...p, ...hist]);

            setStep("chat");
        } catch (err) {
            console.error(err);
            setMessages([{ id: uid(), role: "system", ts: Date.now(), content: "⚠️ Không thể tạo phòng chat. Vui lòng thử lại." }]);
            setStep("form");
        } finally {
            setBusy(false);
        }
    }

    async function send() {
        const text = input.trim();
        if (!text || !convId) return;
        setInput("");

        const me = { id: uid(), role: "user", content: text, ts: Date.now() };
        setMessages((p) => [...p, me]);

        try {
            await apiSendMessage(convId, text);
        } catch (e) {
            setMessages((p) => [...p, { id: uid(), role: "system", ts: Date.now(), content: "⚠️ Gửi tin thất bại." }]);
        }
    }

    function clearChat() {
        if (!confirm("Xóa hội thoại hiện tại?")) return;
        setMessages([]);
        setConvId(null);
        setStep("form");
    }

    // Auto expand textarea height
    useEffect(() => {
        const ta = inputRef.current; if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(140, Math.max(36, ta.scrollHeight)) + "px";
    }, [input]);

    // ===== UI pieces =====
    return (
        <>
            {/* Toggle floating button */}
            <button
                ref={toggleRef}
                onClick={() => setOpen((v) => !v)}
                className={`fixed right-6 z-[9999] ${SZ.panelB} ${SZ.btn} grid place-items-center rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none`}
                aria-label="Hỗ trợ trực tuyến"
            >
                {/* chat bubble icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M2.25 12c0-4.556 4.143-8.25 9.25-8.25s9.25 3.694 9.25 8.25-4.143 8.25-9.25 8.25c-1.3 0-2.537-.244-3.662-.689-.37-.15-.782-.138-1.146.037l-2.38 1.164a.75.75 0 01-1.074-.702l.06-2.26a1.5 1.5 0 00-.442-1.077A7.853 7.853 0 012.25 12z" />
                </svg>
            </button>

            {/* Panel */}
            <div
                ref={panelRef}
                className={`fixed right-6 z-[9998] ${SZ.panelB} ${open ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"} transition-all duration-200`}
            >
                <div className={`bg-white ${SZ.panelW} rounded-2xl border border-gray-100 shadow-[0_8px_36px_rgba(13,47,97,0.08)] overflow-hidden`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-800">Hỗ trợ khách hàng</div>
                        <div className="flex items-center gap-2">
                            {step === "chat" && (
                                <button onClick={clearChat} className="text-xs text-gray-500 hover:text-gray-700">Xóa hội thoại</button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-gray-50" aria-label="Đóng">✕</button>
                        </div>
                    </div>

                    {/* Body */}
                    {step === "form" && (
                        <div className="p-4 space-y-3">
                            <p className="text-sm text-gray-700">Hãy giới thiệu về bạn theo mẫu dưới đây và bắt đầu trò chuyện với chúng tôi.</p>
                            <div className="space-y-2">
                                <label className="block text-xs text-gray-600">Họ và tên<span className="text-red-500"> *</span></label>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-300" : "border-gray-200"}`}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && <div className="text-xs text-red-600">{errors.fullName}</div>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs text-gray-600">Số điện thoại<span className="text-red-500"> *</span></label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-300" : "border-gray-200"}`}
                                    placeholder="0912xxxxxx"
                                />
                                {errors.phone && <div className="text-xs text-red-600">{errors.phone}</div>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs text-gray-600">Email</label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-300" : "border-gray-200"}`}
                                    placeholder="you@example.com"
                                />
                                {errors.email && <div className="text-xs text-red-600">{errors.email}</div>}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button onClick={startChat} disabled={busy} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">Bắt đầu chat</button>
                                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">Cancel</button>
                            </div>
                        </div>
                    )}

                    {step === "initializing" && (
                        <div className="p-6 text-center">
                            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            <div className="text-sm text-gray-700">Đang khởi tạo phòng chat…</div>
                        </div>
                    )}

                    {step === "chat" && (
                        <div className="flex flex-col">
                            <div ref={listRef} className={`px-3 pt-3 overflow-y-auto ${SZ.msgH}`}>
                                {messages.map((m) => (
                                    <div key={m.id} className="mb-2">
                                        {m.role === "system" ? (
                                            <div className="text-center text-[11px] text-gray-400 whitespace-pre-line">{m.content}</div>
                                        ) : (
                                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-gray-100 text-gray-800"}`}>
                                                {m.content}
                                                <div className={`mt-1 text-[10px] opacity-70 ${m.role === "user" ? "text-white" : "text-gray-500"}`}>{fmtTime(m.ts)}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 p-3">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                                        }}
                                        rows={1}
                                        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tin nhắn…"
                                    />
                                    <button onClick={send} className="px-3 h-[38px] rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700">Gửi</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

