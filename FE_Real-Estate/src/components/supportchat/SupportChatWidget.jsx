// /src/components/supportchat/SupportChatWidget.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { supportSliceActions } from "@/store/supportSlice";
import { supportApi } from "@/api/supportApi"; // ⚠️ đúng path services của bạn
import { uploadMany } from "@/api/cloudinary";
import { Client } from "@stomp/stompjs";

/* ===================== Utils ===================== */
const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";

const REACTIONS = [
    { key: "like", emoji: "👍", label: "Thích" },
    { key: "love", emoji: "❤️", label: "Yêu thích" },
    { key: "haha", emoji: "😂", label: "Haha" },
    { key: "wow", emoji: "😮", label: "Wow" },
    { key: "sad", emoji: "😢", label: "Buồn" },
    { key: "angry", emoji: "😡", label: "Tức giận" },
];

function safeJson(x) {
    if (!x) return null;
    if (typeof x === "object") return x; // đã là object
    try {
        return JSON.parse(x);
    } catch {
        return null;
    }
}

const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

const uid = () => Math.random().toString(36).slice(2, 10);

const formatBytes = (b = 0) => {
    if (!b) return "0 B";
    const k = 1024,
        u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${u[i]}`;
};

// Cloudinary helpers
function clThumbFromUrl(secureUrl, { w = 360, h = 360, fit = "c_fill" } = {}) {
    if (!secureUrl) return secureUrl;
    return secureUrl.replace(
        "/upload/",
        `/upload/${fit},w_${w},h_${h},q_auto,f_auto/`
    );
}

// chỉ dùng cho NÚT "Tải xuống" (ép attachment)
function clDownloadUrl(secureUrl, filename) {
    if (!secureUrl) return secureUrl;
    const flag = filename
        ? `fl_attachment:${encodeURIComponent(filename)}`
        : "fl_attachment";
    return secureUrl.replace("/upload/", `/upload/${flag}/`);
}

// Detect loại tệp
function isImage(att) {
    const mime = (att?.mimeType || "").toLowerCase();
    const name = (att?.name || "").toLowerCase();
    return (
        mime.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
    );
}

// ✅ BỔ SUNG: hỗ trợ thêm displayName / name
function defaultsFromUser(user) {
    const name =
        user?.fullName ||
        user?.displayName ||
        user?.name ||
        `${user?.lastName ?? ""} ${user?.firstName ?? ""}`.trim() ||
        "";
    return {
        fullName: name,
        phone: user?.phone || user?.mobile || user?.phoneNumber || "",
        email: user?.email || "",
    };
}

/* ===================== Emoji Portal ===================== */
function EmojiPortal({ open, anchorEl, onClose, children, width = 320, height = 380 }) {
    if (!open || !anchorEl) return null;
    const rect = anchorEl.getBoundingClientRect();
    let top = rect.top - height - 8;
    let left = rect.right - width;
    if (top < 8) top = rect.bottom + 8;
    const maxLeft = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    useEffect(() => {
        const esc = (e) => e.key === "Escape" && onClose?.();
        const rs = () => onClose?.();
        window.addEventListener("resize", rs);
        document.addEventListener("keydown", esc);
        return () => {
            window.removeEventListener("resize", rs);
            document.removeEventListener("keydown", esc);
        };
    }, [onClose]);

    return ReactDOM.createPortal(
        <>
            <div style={{ position: "fixed", inset: 0, zIndex: 10049 }} onMouseDown={onClose} />
            <div
                style={{ position: "fixed", top, left, width, height, zIndex: 10050 }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
}

/* ================== UI: Reaction components ================== */
function ReactionPopover({ visible, onPick, align = "center" }) {
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

// ✅ VERSION MỚI: mỗi emoji một pill, đặt DƯỚI bubble
// mỗi emoji là 1 pill clickable theo đúng lớp Tailwind bạn yêu cầu
function ReactionSummary({ data = {}, side = "right", onReact }) {
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

/* =======================================================================
   SupportChatWidget
   ======================================================================= */
export default function SupportChatWidget({
    user,
    size = "md",
    mode = "embedded",
    showHeader = false,
    offset = { right: 24, bottom: 24 },
    controlledOpen,
    hideFab = false,
    onOpenChange,
}) {
    const dispatch = useDispatch();

    // Từ Redux (global WS listener)
    const incomingWSMsg = useSelector((s) => s.support?.incomingMessage);
    const lastReactionEvent = useSelector((s) => s.support?.lastReactionEvent);

    const sizes = {
        xs: { msgH: "h-[340px]", panelW: "w-[320px]" },
        sm: { msgH: "h-[380px]", panelW: "w-[360px]" },
        md: { msgH: "h-[420px]", panelW: "w-[400px]" },
    };
    const SZ = sizes[size] ?? sizes.md;

    const currentUserId = user?.id || user?.userId || null;

    const userKey =
        user && (user.id || user.userId) ? String(user.id || user.userId) : "guest";
    const isGuest = userKey === "guest";
    const prevIsGuestRef = useRef(isGuest);
    const sk = (k) => `support_${userKey}_${k}`;

    const guestClientRef = useRef(null); // WS client cho khách
    const guestSubRef = useRef(null); // subscription hiện tại

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const fileImageInputRef = useRef(null);
    const fileAnyInputRef = useRef(null);
    const emojiBtnRef = useRef(null);

    // De-dup state
    const seenServerIdsRef = useRef(new Set()); // server messageId đã thấy
    const seenSigRef = useRef(new Set()); // chữ ký tạm khi WS chưa có id
    const seenClientIdsRef = useRef(new Set()); // clientId đã xử lý
    const pendingByClientIdRef = useRef(new Map());

    const [openState, setOpenState] = useState(() => {
        if (typeof controlledOpen === "boolean") return controlledOpen;
        return localStorage.getItem(sk("open")) === "1";
    });
    const open =
        mode === "embedded"
            ? true
            : typeof controlledOpen === "boolean"
                ? controlledOpen
                : openState;
    const setOpen = (v) => {
        if (mode === "embedded") return;
        const next = typeof v === "function" ? v(open) : v;
        if (typeof controlledOpen !== "boolean") {
            setOpenState(next);
            localStorage.setItem(sk("open"), next ? "1" : "0");
        }
        onOpenChange?.(next);
    };

    const [step, setStep] = useState(() => localStorage.getItem(sk("step")) || "form");
    const [convId, setConvId] = useState(() => localStorage.getItem(sk("cid")) || null);

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    const [form, setForm] = useState(() => {
        const raw = localStorage.getItem(sk("form"));
        const saved = safeParse(raw);
        const defaults = defaultsFromUser(user);
        return saved ? { ...defaults, ...saved } : defaults;
    });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const [messages, setMessages] = useState(() => {
        const raw = localStorage.getItem(sk("msgs"));
        if (raw)
            try {
                return JSON.parse(raw);
            } catch { }
        return [];
    });
    const [input, setInput] = useState("");
    const [attachments, setAttachments] = useState([]); // [{id,file,url,name,size,type}]
    const [showEmoji, setShowEmoji] = useState(false);

    // Reactions
    const [reactionsByMsg, setReactionsByMsg] = useState({});
    const [pickerFor, setPickerFor] = useState(null);
    const [pickerAlign, setPickerAlign] = useState("center");
    const [pickerFileIndex, setPickerFileIndex] = useState(null);

    // Convert ReactionDto[] -> map {emoji: {count, mine}}
    function dtosToMap(dtos = []) {
        const m = {};
        for (const r of dtos) {
            const e = r.emoji || r.key || r.reaction;
            if (!e) continue;
            if (!m[e]) m[e] = { count: 0, mine: false };
            m[e].count++;
            if (currentUserId && String(r.userId) === String(currentUserId)) m[e].mine = true;
        }
        return m;
    }

    useEffect(() => localStorage.setItem(sk("step"), step), [step, userKey]);
    useEffect(() => localStorage.setItem(sk("cid"), convId ?? ""), [convId, userKey]);
    useEffect(() => localStorage.setItem(sk("form"), JSON.stringify(form)), [form, userKey]);
    useEffect(
        () => localStorage.setItem(sk("msgs"), JSON.stringify(messages)),
        [messages, userKey]
    );

    // Khi chuyển từ user thật -> guest (logout), xoá form + storage của guest
    useEffect(() => {
        const wasGuest = prevIsGuestRef.current;
        if (!wasGuest && isGuest) {
            setForm({ fullName: "", phone: "", email: "" });
            try {
                localStorage.removeItem(`support_guest_form`);
                localStorage.removeItem(`support_${userKey}_form`);
            } catch { }
            setStep("form");
        }
        prevIsGuestRef.current = isGuest;
    }, [isGuest]);

    const lastUserRef = useRef(userKey);
    useEffect(() => {
        if (lastUserRef.current !== userKey) {
            lastUserRef.current = userKey;
            setStep("form");
            setConvId(null);
            setMessages([]);
            setShowEmoji(false);
            seenServerIdsRef.current.clear();
            seenSigRef.current.clear();
            seenClientIdsRef.current.clear();
            pendingByClientIdRef.current.clear();
            setReactionsByMsg({});
            const defaults = defaultsFromUser(user);
            setForm((prev) => {
                const empty = !prev || (!prev.fullName && !prev.phone && !prev.email);
                if (empty || userKey !== "guest") return defaults;
                return prev;
            });
        }
    }, [userKey, user]);

    // ✅ Nếu đang ở bước form và form còn trống, khi user có dữ liệu -> tự điền
    useEffect(() => {
        if (step !== "form") return;
        const defaults = defaultsFromUser(user);
        setForm((prev) => {
            const empty = !prev || (!prev.fullName && !prev.phone && !prev.email);
            return empty ? defaults : prev;
        });
    }, [user, step]);

    useEffect(() => {
        if (!open) setShowEmoji(false);
    }, [open]);

    useEffect(() => {
        if (mode === "embedded" || !open) return;
        const onDown = (e) => {
            const inPanel = panelRef.current?.contains(e.target);
            const inToggle = toggleRef.current?.contains(e.target);
            if (!inPanel && !inToggle) setOpen(false);
        };
        const onEsc = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open, mode]);

    // auto scroll bottom khi có message mới
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length]);

    // autosize textarea
    useEffect(() => {
        const ta = inputRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(140, Math.max(38, ta.scrollHeight)) + "px";
    }, [input]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        addFiles(files);
    }, []);
    const onDragOver = (e) => e.preventDefault();

    // paste images
    useEffect(() => {
        const handler = (e) => {
            if (!e.clipboardData) return;
            const items = Array.from(e.clipboardData.items || []);
            const files = items
                .filter((i) => i.kind === "file")
                .map((i) => i.getAsFile())
                .filter(Boolean);
            if (files.length) addFiles(files);
        };
        if (panelRef.current) panelRef.current.addEventListener("paste", handler);
        return () => panelRef.current?.removeEventListener("paste", handler);
    }, []);

    function validate() {
        const e = {};
        if (!form.fullName?.trim()) e.fullName = "Bắt buộc";
        if (!form.phone?.trim()) e.phone = "Bắt buộc";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = "Email không hợp lệ";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function mapMessage(m) {
        return {
            id: m.messageId || m.id || m.message_id || uid(),
            messageId: m.messageId || m.id || m.message_id,
            clientId: m.clientId || m.clientMessageId || m.client_message_id || m.clientMsgId,
            role: (m.senderRole || m.role) === "ADMIN" ? "admin" : "user",
            content: m.content || m.text || "",
            ts: m.createdAt ? Date.parse(m.createdAt) : m.ts || Date.now(),
            attachments: (m.attachments || []).map((a) => ({
                url: a.url,
                name: a.name,
                size: a.sizeBytes || a.size,
                mimeType: a.mimeType || "",
            })),
            reactions: m.reactions || [],
        };
    }

    function normalizeWsEvent(evt) {
        const e = evt?.data ?? evt;
        const convIdFromEvt =
            e?.conversationId ??
            e?.conversation_id ??
            e?.conversation?.id ??
            evt?.conversationId ??
            evt?.conversation?.id;
        const rawMsg = e?.message ?? e;
        const merged = { ...rawMsg };
        if (!merged.conversationId && convIdFromEvt != null) {
            merged.conversationId = convIdFromEvt;
        }
        const cid = merged.conversationId != null ? String(merged.conversationId) : null;
        return { convId: cid, msg: merged };
    }

    // Load messages khi có convId
    useEffect(() => {
        if (!convId) return;
        dispatch(supportSliceActions.setActive(convId));
        supportApi.markRead({ conversationId: convId, who: "USER" }).catch(() => { });
        (async () => {
            try {
                const page = await supportApi.fetchMessages({
                    conversationId: convId,
                    page: 0,
                    size: 50,
                });
                const list = Array.isArray(page?.content)
                    ? page.content
                    : Array.isArray(page)
                        ? page
                        : [];
                setMessages(list.map(mapMessage));

                // seed seen
                const seen = seenServerIdsRef.current;
                seen.clear();
                seenSigRef.current.clear();
                seenClientIdsRef.current.clear();

                // build reactions map
                const rx = {};
                list.forEach((m) => {
                    const id = m.messageId || m.id || m.message_id;
                    if (id) seen.add(String(id));
                    const dtos = m.reactions || [];
                    if (id) rx[String(id)] = dtosToMap(dtos);
                });
                setReactionsByMsg(rx);
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convId]);

    // ===== Guest-only WebSocket: listen /topic/support.conversation.{convId}
    useEffect(() => {
        if (!convId) return;

        // Hủy client/sub cũ nếu có
        try {
            guestSubRef.current?.unsubscribe?.();
            guestClientRef.current?.deactivate?.();
        } catch { }

        guestSubRef.current = null;
        guestClientRef.current = null;

        // Tạo client KHÔNG header Authorization
        const c = new Client({
            webSocketFactory: () => new WebSocket(WS_URL),
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (s) => console.log("[WS-guest]", s),
        });

        c.onConnect = () => {
            guestSubRef.current = c.subscribe(`/topic/support.conversation.${convId}`, (m) => {
                const evt = safeJson(m.body);
                if (!evt) return;

                // ---- Reaction updated qua topic ----
                if (evt?.type === "reaction.updated" || evt?.eventType === "reaction.updated") {
                    const d = evt.data || evt.payload || {};
                    if (String(d.conversationId) === String(convId) && d.messageId) {
                        setReactionsByMsg((prev) => ({
                            ...prev,
                            [String(d.messageId)]: dtosToMap(d.reactions || []),
                        }));
                    }
                    return;
                }

                // Chuẩn hoá message
                const e = evt?.data ?? evt;
                const rawMsg = e?.message ?? e;
                const msg = rawMsg || {};

                const serverId = String(
                    msg.messageId || msg.id || msg.message_id || msg.uuid || ""
                );
                const clientIdFromWs =
                    msg.clientId || msg.clientMessageId || msg.client_message_id || msg.clientMsgId;

                // Nếu tin này là echo của bubble optimistic → replace
                if (clientIdFromWs && pendingByClientIdRef.current.has(clientIdFromWs)) {
                    const idx = pendingByClientIdRef.current.get(clientIdFromWs);
                    const mapped = mapMessage(msg);
                    setMessages((prev) => {
                        const next = prev.slice();
                        next[idx] = mapped;
                        return next;
                    });
                    pendingByClientIdRef.current.delete(clientIdFromWs);
                    if (serverId) seenServerIdsRef.current.add(serverId);

                    if (mapped.messageId && Array.isArray(msg.reactions)) {
                        setReactionsByMsg((prev) => ({
                            ...prev,
                            [String(mapped.messageId)]: dtosToMap(msg.reactions),
                        }));
                    }
                    return;
                }

                // Nếu đã thấy clientId này (echo trùng) → bỏ
                if (clientIdFromWs && seenClientIdsRef.current.has(String(clientIdFromWs))) {
                    return;
                }

                // Khử trùng theo serverId / chữ ký
                if (serverId) {
                    if (seenServerIdsRef.current.has(serverId)) return;
                    seenServerIdsRef.current.add(serverId);
                } else {
                    const sig = `${(msg.senderRole || msg.role) || ""}|${(msg.content || msg.text) || ""
                        }|${Date.parse(msg.createdAt) || 0}`;
                    if (seenSigRef.current.has(sig)) return;
                    seenSigRef.current.add(sig);
                    setTimeout(() => seenSigRef.current.delete(sig), 8000);
                }

                const mapped = mapMessage(msg);
                setMessages((p) => [...p, mapped]);

                if (mapped.messageId && Array.isArray(msg.reactions)) {
                    setReactionsByMsg((prev) => ({
                        ...prev,
                        [String(mapped.messageId)]: dtosToMap(msg.reactions),
                    }));
                }
            });
        };
        c.onStompError = (f) =>
            console.error("[WS-guest] STOMP error:", f.headers?.message, f.body);
        c.onWebSocketClose = (e) => console.warn("[WS-guest] Closed:", e?.code, e?.reason);
        c.onWebSocketError = (e) => console.error("[WS-guest] Error:", e);

        c.activate();
        guestClientRef.current = c;

        return () => {
            try {
                guestSubRef.current?.unsubscribe?.();
                guestClientRef.current?.deactivate?.();
            } catch { }
            guestSubRef.current = null;
            guestClientRef.current = null;
        };
    }, [convId]);

    // Nhận WS từ global WebSocketListener
    useEffect(() => {
        if (!incomingWSMsg || !convId) return;

        // Reaction updated từ global listener
        if (
            incomingWSMsg?.type === "reaction.updated" ||
            incomingWSMsg?.eventType === "reaction.updated"
        ) {
            const d = incomingWSMsg.data || incomingWSMsg.payload || {};
            if (String(d.conversationId) === String(convId) && d.messageId) {
                setReactionsByMsg((prev) => ({
                    ...prev,
                    [String(d.messageId)]: dtosToMap(d.reactions || []),
                }));
            }
            return;
        }

        const { convId: wsConvId, msg } = normalizeWsEvent(incomingWSMsg);
        if (!wsConvId || String(wsConvId) !== String(convId)) return;

        const serverId = String(msg.messageId || msg.id || msg.message_id || msg.uuid || "");
        const clientIdFromWs =
            msg.clientId || msg.clientMessageId || msg.client_message_id || msg.clientMsgId;

        // 1) Nếu có clientId và đang pending → REPLACE
        if (clientIdFromWs && pendingByClientIdRef.current.has(clientIdFromWs)) {
            const idx = pendingByClientIdRef.current.get(clientIdFromWs);
            const mapped = mapMessage(msg);
            setMessages((prev) => {
                const next = prev.slice();
                next[idx] = mapped;
                return next;
            });
            pendingByClientIdRef.current.delete(clientIdFromWs);
            seenClientIdsRef.current.add(String(clientIdFromWs));
            if (serverId) seenServerIdsRef.current.add(serverId);
            supportApi.markRead({ conversationId: convId, who: "USER" }).catch(() => { });
            if (mapped.messageId && Array.isArray(msg.reactions)) {
                setReactionsByMsg((prev) => ({
                    ...prev,
                    [String(mapped.messageId)]: dtosToMap(msg.reactions),
                }));
            }
            return;
        }

        // 2) Nếu clientId đã xử lý rồi (WS lặp) → bỏ
        if (clientIdFromWs && seenClientIdsRef.current.has(String(clientIdFromWs))) {
            return;
        }

        // 3) De-dup theo serverId
        if (serverId) {
            if (seenServerIdsRef.current.has(serverId)) return;
            seenServerIdsRef.current.add(serverId);
        } else {
            // 4) Chưa có id → dùng signature tạm
            const sig = `${(msg.senderRole || msg.role) || ""}|${(msg.content || msg.text) || ""
                }|${Date.parse(msg.createdAt) || 0}`;
            if (seenSigRef.current.has(sig)) return;
            setTimeout(() => seenSigRef.current.delete(sig), 8000);
            seenSigRef.current.add(sig);
        }

        const mapped = mapMessage(msg);
        setMessages((p) => [...p, mapped]);
        supportApi.markRead({ conversationId: convId, who: "USER" }).catch(() => { });
        if (mapped.messageId && Array.isArray(msg.reactions)) {
            setReactionsByMsg((prev) => ({
                ...prev,
                [String(mapped.messageId)]: dtosToMap(msg.reactions),
            }));
        }
    }, [incomingWSMsg, convId, dispatch]);

    // Lắng sự kiện reaction từ Redux slice (đẩy bởi WebSocketListener)
    useEffect(() => {
        if (!lastReactionEvent || !convId) return;
        if (String(lastReactionEvent.conversationId) !== String(convId)) return;
        const mid = String(lastReactionEvent.messageId);
        setReactionsByMsg((prev) => ({
            ...prev,
            [mid]: dtosToMap(lastReactionEvent.reactions || []),
        }));
    }, [lastReactionEvent, convId]);

    // ===== Bắt đầu chat =====
    async function startChat() {
        setBusy(true);
        setStep("initializing");
        try {
            const hasInfo = !!(form.fullName?.trim() && form.phone?.trim());
            const payload = hasInfo
                ? {
                    subject: "Yêu cầu hỗ trợ",
                    guestName: form.fullName,
                    guestPhone: form.phone,
                    guestEmail: form.email,
                }
                : { subject: "Khách vãng lai", guest: true };

            const res = await supportApi.createConversation(payload);
            const id = res?.conversationId || res?.id || res;

            setConvId(String(id));
            const nowLine = new Date().toLocaleDateString("vi-VN");
            const intro = hasInfo
                ? `Cảm ơn bạn đã cung cấp thông tin\n${form.fullName} | ${form.phone}${form.email ? ` | ${form.email}` : ""
                }`
                : "Bạn đang chat với tư cách khách vãng lai. Bạn có thể bổ sung thông tin bất cứ lúc nào.";

            setMessages([
                { id: uid(), role: "system", ts: Date.now(), content: nowLine },
                { id: uid(), role: "system", ts: Date.now(), content: intro },
            ]);
            setReactionsByMsg({});
            setStep("chat");
            setTimeout(() => inputRef.current?.focus(), 50);
        } catch {
            setMessages((p) => [
                ...p,
                {
                    id: uid(),
                    role: "system",
                    ts: Date.now(),
                    content: "⚠️ Không thể tạo phòng chat. Vui lòng thử lại.",
                },
            ]);
            setStep("form");
        } finally {
            setBusy(false);
        }
    }

    async function ensureConversation() {
        if (convId) return convId;
        try {
            const payload =
                !form.fullName?.trim() || !form.phone?.trim()
                    ? { subject: "Khách vãng lai", guest: true }
                    : {
                        subject: "Yêu cầu hỗ trợ",
                        guestName: form.fullName,
                        guestPhone: form.phone,
                        guestEmail: form.email,
                    };
            const res = await supportApi.createConversation(payload);
            const id = res?.conversationId || res?.id || res;
            setConvId(String(id));
            setStep("chat");
            setMessages((p) => [
                ...p,
                { id: uid(), role: "system", ts: Date.now(), content: "Đã tạo hội thoại mới." },
            ]);
            return String(id);
        } catch {
            setMessages((p) => [
                ...p,
                { id: uid(), role: "system", ts: Date.now(), content: "⚠️ Không thể tạo hội thoại." },
            ]);
            return null;
        }
    }

    // ===== Attachments =====
    function addFiles(files) {
        const next = files.map((f) => {
            const isImg = (f.type || "").startsWith("image/");
            return {
                id: uid(),
                file: f,
                url: URL.createObjectURL(f),
                name: f.name || (isImg ? "image.png" : "file"),
                size: f.size || 0,
                type: isImg ? "image" : "file",
            };
        });
        setAttachments((p) => [...p, ...next]);
    }

    function removeAttachment(id) {
        setAttachments((p) => p.filter((a) => a.id !== id));
    }

    // Upload thật lên Cloudinary
    async function tryUpload(localAttachments) {
        if (!localAttachments?.length) return [];
        const files = localAttachments.filter((a) => a.file).map((a) => a.file);
        if (!files.length) {
            return localAttachments.map((a) => ({
                url: a.url,
                name: a.name,
                size: a.size,
                mimeType:
                    a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
            }));
        }
        const folder = convId ? `support/${convId}` : "support";
        const results = await uploadMany(files, folder); // [{secure_url, public_id, resource_type}]
        let j = 0;
        return localAttachments.map((a) => {
            if (!a.file) {
                return {
                    url: a.url,
                    name: a.name,
                    size: a.size,
                    mimeType:
                        a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
                };
            }
            const r = results[j++];
            return {
                url: r.secure_url,
                name: a.name,
                size: a.size,
                mimeType:
                    a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
                publicId: r.public_id,
                resourceType: r.resource_type,
            };
        });
    }

    // ===== Reaction helpers =====
    function toggleLocalReaction(messageId, emoji) {
        setReactionsByMsg((prev) => {
            const cur = { ...(prev[messageId] || {}) };
            const item = cur[emoji] || { count: 0, mine: false };
            const mine = !item.mine;
            const count = Math.max(0, mine ? item.count + 1 : item.count - 1);
            cur[emoji] = { count, mine };
            return { ...prev, [messageId]: cur };
        });
    }

    async function handleReact(messageId, emoji) {
        setPickerFor(null);
        setPickerFileIndex(null);
        // optimistic
        toggleLocalReaction(messageId, emoji);
        try {
            const list = await supportApi.toggleReaction(messageId, emoji); // List<ReactionDto>
            setReactionsByMsg((prev) => ({
                ...prev,
                [messageId]: dtosToMap(list),
            }));
        } catch {
            // rollback
            toggleLocalReaction(messageId, emoji);
        }
    }

    // ===== Send =====
    async function send() {
        const text = input.trim();
        if (!text && attachments.length === 0) return;

        const id = await ensureConversation();
        if (!id) return;

        setInput("");
        setShowEmoji(false);

        const localAtts = attachments.slice();
        setAttachments([]);

        // revoke blob URLs
        try {
            localAtts.forEach((a) => {
                if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
            });
        } catch { }

        const clientId = `c_${uid()}`;
        // đánh dấu đã thấy để tránh echo đúp
        seenClientIdsRef.current.add(clientId);

        // optimistic bubble
        const optimistic = {
            id: `tmp_${Date.now()}`,
            clientId,
            role: "user",
            content: text || "",
            ts: Date.now(),
            attachments: localAtts.map((a) => ({
                url: a.url,
                name: a.name,
                size: a.size,
                mimeType:
                    a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
                _local: true,
            })),
        };

        setMessages((p) => {
            const next = [...p, optimistic];
            pendingByClientIdRef.current.set(clientId, next.length - 1);
            return next;
        });

        try {
            const uploaded = localAtts.length ? await tryUpload(localAtts) : [];
            const res = await supportApi.sendMessage({
                conversationId: id,
                content: text || "",
                attachments: uploaded,
                clientId,
                clientMessageId: clientId,
                clientMsgId: clientId,
            });

            // Nếu REST trả về trước WS → replace và mark seen
            if (res && (res.messageId || res.id)) {
                const idx = pendingByClientIdRef.current.get(clientId);
                if (typeof idx === "number") {
                    const mapped = mapMessage(res);
                    setMessages((prev) => {
                        const next = prev.slice();
                        next[idx] = mapped;
                        return next;
                    });
                    // seed reactions nếu res có
                    if (mapped.messageId && Array.isArray(res.reactions)) {
                        setReactionsByMsg((prev) => ({
                            ...prev,
                            [String(mapped.messageId)]: dtosToMap(res.reactions),
                        }));
                    }
                    pendingByClientIdRef.current.delete(clientId);
                    seenClientIdsRef.current.add(String(clientId));
                    const sid = String(res.messageId || res.id || res.message_id || "");
                    if (sid) seenServerIdsRef.current.add(sid);
                }
            }
        } catch {
            setMessages((p) => [
                ...p,
                { id: uid(), role: "system", ts: Date.now(), content: "⚠️ Gửi tin thất bại." },
            ]);
            pendingByClientIdRef.current.delete(clientId);
        }
    }

    /* ================== Body ================== */
    const Body = (
        <>
            {step === "form" && (
                <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-700">Nhập thông tin để bắt đầu trò chuyện.</p>

                    <div className="space-y-2">
                        <input
                            value={form.fullName}
                            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Họ và tên"
                        />
                        {errors.fullName && <div className="text-xs text-red-600">{errors.fullName}</div>}
                    </div>

                    <div className="space-y-2">
                        <input
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Số điện thoại"
                        />
                        {errors.phone && <div className="text-xs text-red-600">{errors.phone}</div>}
                    </div>

                    <div className="space-y-2">
                        <input
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Email (tuỳ chọn)"
                        />
                        {errors.email && <div className="text-xs text-red-600">{errors.email}</div>}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => {
                                // cho phép bắt đầu ngay; nếu muốn bắt buộc -> if (!validate()) return;
                                startChat();
                            }}
                            disabled={busy}
                            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                        >
                            Bắt đầu chat
                        </button>
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
                <div className="flex flex-col" onDrop={onDrop} onDragOver={onDragOver} ref={panelRef}>
                    {/* Messages */}
                    <div ref={listRef} className={`px-3 pt-3 overflow-y-auto ${SZ.msgH}`}>
                        {messages.map((m) => {
                            const imgs = (m.attachments || []).filter((a) => isImage(a));
                            const files = (m.attachments || []).filter((a) => !isImage(a));
                            const hasText = !!(m.content || "").trim();

                            const isUser = m.role === "user";
                            const align = isUser ? "justify-end" : "justify-start";
                            const bubbleColor = isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800";
                            const msgId = String(m.messageId || m.id || "");
                            const mySide = isUser ? "right" : "left";

                            return (
                                <div key={m.id} className="mb-5">
                                    {m.role === "system" ? (
                                        <div className="text-center text-[11px] text-gray-400 whitespace-pre-line">
                                            {m.content}
                                        </div>
                                    ) : (
                                        <>
                                            {/* ===== BUBBLE TEXT (không chứa ảnh/tệp) ===== */}
                                            {hasText && (
                                                <div className={`flex ${align}`}>
                                                    <div className={`relative group w-fit max-w-[80%] inline-flex flex-col ${bubbleColor} rounded-2xl px-3 py-2 whitespace-pre-wrap break-words`}>
                                                        <div className="text-sm leading-5">{m.content}</div>
                                                        <div className={`mt-1 text-[10px] ${isUser ? "text-white/80 self-end" : "text-gray-500 self-start"}`}>
                                                            {fmtTime(m.ts)}
                                                        </div>

                                                        {/* Reaction button bám bubble */}
                                                        {currentUserId && (
                                                            <div
                                                                className={`absolute -bottom-5 ${isUser ? "right-2" : "left-2"} opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition`}
                                                            >
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPickerFor((p) => (p === msgId ? null : msgId));
                                                                        setPickerAlign(isUser ? "right" : "left");
                                                                    }}
                                                                    className={`h-7 w-7 grid place-items-center rounded-full ${isUser ? "bg-white/20 text-white" : "bg-white text-gray-700 border"} shadow`}
                                                                    title="Thả cảm xúc"
                                                                >
                                                                    👍
                                                                </button>
                                                            </div>
                                                        )}

                                                        <ReactionPopover
                                                            visible={pickerFor === msgId}
                                                            align={pickerAlign}
                                                            onPick={(emoji) => handleReact(msgId, emoji)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* ===== GALLERY ẢNH (ngoài bubble, có nút reaction overlay từng ảnh) ===== */}
                                            {!!imgs.length && (
                                                <div className={`flex ${align}`}>
                                                    <div className={`${isUser ? "items-end" : "items-start"} flex flex-col w-full`}>
                                                        <div
                                                            className={`mt-2 grid gap-2 ${imgs.length === 1
                                                                ? "grid-cols-1 max-w-[320px]"
                                                                : "grid-cols-[repeat(auto-fill,minmax(96px,1fr))] max-w-[360px]"
                                                                }`}
                                                        >
                                                            {imgs.map((a, i) => {
                                                                const openHref = a.url;
                                                                const thumb = a._local ? a.url : clThumbFromUrl(a.url, { w: 520, h: 520 });
                                                                return (
                                                                    <div key={i} className="relative group">
                                                                        <a href={openHref} target="_blank" rel="noreferrer" className="block">
                                                                            <img
                                                                                src={thumb}
                                                                                alt={a.name || `image-${i}`}
                                                                                className={`rounded-xl ${imgs.length === 1
                                                                                    ? "max-w-[320px] max-h-[360px] w-auto h-auto"
                                                                                    : "w-[120px] h-[120px] object-cover"
                                                                                    }`}
                                                                            />
                                                                        </a>

                                                                        {/* Nút reaction overlay trên từng ảnh */}
                                                                        {currentUserId && (
                                                                            <button
                                                                                className="absolute bottom-1 right-1 h-7 w-7 grid place-items-center rounded-full bg-white/90 text-gray-700 shadow border opacity-0 group-hover:opacity-100 transition"
                                                                                title="Thả cảm xúc"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setPickerFor((p) => (p === msgId ? null : msgId));
                                                                                    setPickerAlign(isUser ? "right" : "left");
                                                                                }}
                                                                            >
                                                                                👍
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Nếu KHÔNG có text, vẫn hiện giờ + nút reaction chung */}
                                                        {!hasText && (
                                                            <>
                                                                <div className="mt-1 text-[10px] text-gray-500 whitespace-nowrap leading-none self-end">
                                                                    {fmtTime(m.ts)}
                                                                </div>

                                                                {currentUserId && (
                                                                    <div className="relative group mt-1 self-end">
                                                                        <button
                                                                            className="opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-full bg-white shadow border grid place-items-center"
                                                                            title="Thả cảm xúc"
                                                                            onClick={() => {
                                                                                setPickerFor((p) => (p === msgId ? null : msgId));
                                                                                setPickerAlign(isUser ? "right" : "left");
                                                                            }}
                                                                        >
                                                                            👍
                                                                        </button>

                                                                        <div className={`absolute z-50 -top-10 ${isUser ? "right-0" : "left-0"}`}>
                                                                            <ReactionPopover
                                                                                visible={pickerFor === msgId}
                                                                                align={pickerAlign}
                                                                                onPick={(emoji) => handleReact(msgId, emoji)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ===== FILE CARDS (ngoài bubble, có nút reaction overlay từng file) ===== */}
                                            {/* ===== FILE CARDS (ngoài bubble, có nút reaction + popover từng file) ===== */}
                                            {!!files.length && (
                                                <div className={`flex ${align}`}>
                                                    <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-[360px]">
                                                        {files.map((a, i) => {
                                                            const openHref = a.url;
                                                            const dlHref = clDownloadUrl(a.url, a.name);
                                                            const lower = (a.name || "").toLowerCase();
                                                            const icon = lower.endsWith(".pdf")
                                                                ? "📕"
                                                                : /\.(doc|docx)$/.test(lower)
                                                                    ? "📝"
                                                                    : /\.(xls|xlsx)$/.test(lower)
                                                                        ? "📗"
                                                                        : /\.(ppt|pptx)$/.test(lower)
                                                                            ? "📙"
                                                                            : "📄";

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`relative group flex items-center justify-between rounded-xl px-3 py-2 bg-white text-gray-800 border ${isUser ? "border-blue-100" : "border-gray-200"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-lg">{icon}</span>
                                                                        <div className="min-w-0">
                                                                            <a
                                                                                href={openHref}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="block text-sm truncate text-blue-600 hover:underline"
                                                                                title={a.name}
                                                                            >
                                                                                {a.name || "file"}
                                                                            </a>
                                                                            <div className="text-[11px] text-gray-500">
                                                                                {a.size ? formatBytes(a.size) : ""}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1 pl-2">
                                                                        <a
                                                                            href={openHref}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="h-7 w-7 grid place-items-center rounded-md bg-gray-100 hover:bg-gray-200"
                                                                            title="Mở"
                                                                        >
                                                                            📂
                                                                        </a>
                                                                        <a
                                                                            href={dlHref}
                                                                            className="h-7 w-7 grid place-items-center rounded-md bg-gray-100 hover:bg-gray-200"
                                                                            title="Tải xuống"
                                                                        >
                                                                            ⬇
                                                                        </a>
                                                                    </div>

                                                                    {/* Nút reaction overlay góc card */}
                                                                    {currentUserId && (
                                                                        <button
                                                                            className="absolute -top-2 -right-2 h-7 w-7 grid place-items-center rounded-full bg-white text-gray-700 shadow border opacity-0 group-hover:opacity-100 transition"
                                                                            title="Thả cảm xúc"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setPickerFor((p) => (p === msgId && pickerFileIndex === i ? null : msgId));
                                                                                setPickerAlign(isUser ? "right" : "left");
                                                                                setPickerFileIndex((prev) => (pickerFor === msgId && prev === i ? null : i));
                                                                            }}
                                                                        >
                                                                            👍
                                                                        </button>
                                                                    )}

                                                                    {/* Popover chọn emoji — bám theo đúng file card */}
                                                                    <div className={`absolute z-50 -top-10 ${isUser ? "right-0" : "left-0"}`}>
                                                                        <ReactionPopover
                                                                            visible={pickerFor === msgId && pickerFileIndex === i}
                                                                            align={pickerAlign}
                                                                            onPick={(emoji) => handleReact(msgId, emoji)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}


                                            {/* ===== REACTION SUMMARY (dưới cùng, canh theo phía) ===== */}
                                            <div className={`flex ${align}`}>
                                                <ReactionSummary
                                                    data={reactionsByMsg[msgId]}
                                                    side={mySide}
                                                    onReact={(emoji) => handleReact(msgId, emoji)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Preview attachments chưa gửi */}
                    {!!attachments.length && (
                        <div className="px-3 pb-2">
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((a) =>
                                    a.type === "image" ? (
                                        <div key={a.id} className="relative">
                                            <img
                                                src={a.url}
                                                alt={a.name}
                                                className="w-20 h-20 object-cover rounded-lg border"
                                            />
                                            <button
                                                onClick={() => removeAttachment(a.id)}
                                                className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs"
                                                title="Xóa"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            key={a.id}
                                            className="px-2 py-1 rounded-lg border text-xs flex items-center gap-2 bg-gray-50"
                                        >
                                            <span>📄</span>
                                            <span className="max-w-[160px] truncate">{a.name}</span>
                                            <span className="opacity-60">{formatBytes(a.size)}</span>
                                            <button
                                                onClick={() => removeAttachment(a.id)}
                                                className="ml-1 text-gray-500 hover:text-red-600"
                                                title="Xóa"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="border-t border-gray-200 bg-white p-3">
                        <div className="flex items-center gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                                rows={1}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 min-h-[38px] resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[140px] overflow-y-auto"
                            />

                            {/* Emoji */}
                            <div className="relative">
                                <button
                                    ref={emojiBtnRef}
                                    onClick={() => setShowEmoji((v) => !v)}
                                    className={`h-[38px] w-[38px] flex items-center justify-center rounded-xl ${showEmoji ? "bg-gray-200" : "bg-gray-50 hover:bg-gray-100"
                                        } text-lg`}
                                    title="Chèn emoji"
                                >
                                    😀
                                </button>
                                <EmojiPortal
                                    open={showEmoji}
                                    anchorEl={emojiBtnRef.current}
                                    onClose={() => setShowEmoji(false)}
                                    width={320}
                                    height={380}
                                >
                                    <div className="shadow-xl border border-gray-200 rounded-2xl overflow-hidden bg-white">
                                        <EmojiPicker
                                            onEmojiClick={(e) => setInput((v) => v + e.emoji)}
                                            theme="light"
                                            height={380}
                                            width={320}
                                            searchDisabled
                                            skinTonesDisabled
                                            lazyLoadEmojis
                                        />
                                    </div>
                                </EmojiPortal>
                            </div>

                            {/* Image picker */}
                            <button
                                onClick={() => fileImageInputRef.current?.click()}
                                className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100"
                                title="Gửi ảnh"
                            >
                                🖼️
                            </button>
                            <input
                                ref={fileImageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length) addFiles(files);
                                    e.target.value = "";
                                }}
                            />

                            {/* Any file picker */}
                            <button
                                onClick={() => fileAnyInputRef.current?.click()}
                                className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100"
                                title="Đính kèm tệp"
                            >
                                📎
                            </button>
                            <input
                                ref={fileAnyInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length) addFiles(files);
                                    e.target.value = "";
                                }}
                            />

                            <button
                                onClick={send}
                                className="h-[38px] px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (mode === "embedded") {
        return (
            <div className={`bg-white ${SZ.panelW}`}>
                {showHeader && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 mt-1">
                        <div className="font-semibold text-gray-800">Hỗ trợ khách hàng</div>
                    </div>
                )}
                {Body}
            </div>
        );
    }

    // Standalone
    return (
        <>
            {!hideFab && (
                <button
                    ref={toggleRef}
                    onClick={() => setOpen((v) => !v)}
                    style={{
                        position: "fixed",
                        right: offset.right,
                        bottom: offset.bottom + 72,
                        zIndex: 10000,
                    }}
                    className="h-12 w-12 grid place-items-center rounded-full shadow-lg bg-violet-600 text-white hover:bg-violet-700"
                    aria-label="Hỗ trợ khách hàng"
                >
                    💬
                </button>
            )}

            <div
                ref={panelRef}
                style={{
                    position: "fixed",
                    right: offset.right,
                    bottom: offset.bottom + 72,
                    zIndex: 9400,
                }}
                className={`${open ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
                    } transition-all duration-200`}
            >
                <div
                    className={`bg-white ${SZ.panelW} rounded-2xl border border-gray-100 shadow-[0_8px_36px_rgba(13,47,97,0.08)] overflow-hidden`}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-800">Hỗ trợ khách hàng</div>
                    </div>
                    {Body}
                </div>
            </div>
        </>
    );
}
