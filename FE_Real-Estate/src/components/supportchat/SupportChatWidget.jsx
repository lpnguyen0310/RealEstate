// /src/components/supportchat/SupportChatWidget.jsx
import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Client } from "@stomp/stompjs";

import { supportSliceActions } from "@/store/supportSlice";
import { supportApi } from "@/api/supportApi";
import { uploadMany } from "@/api/cloudinary";

import ChatMessageList from "./ChatMessageList";
import AttachmentsPreview from "./AttachmentsPreview";
import ChatInputBar from "./ChatInputBar";
import {
    uid,
    formatBytes,
} from "./supportChatUtils";

/* ===================== Utils ===================== */
const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";

function safeJson(x) {
    if (!x) return null;
    if (typeof x === "object") return x;
    try {
        return JSON.parse(x);
    } catch {
        return null;
    }
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

// Convert ReactionDto[] -> map {emoji: {count, mine}}
function dtosToMap(dtos = [], currentUserId) {
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

    // isGuest chỉ dùng để biết người đang login hay không, KHÔNG còn liên quan tới key localStorage
    const userKey =
        user && (user.id || user.userId) ? String(user.id || user.userId) : "guest";
    const isGuest = userKey === "guest";
    const prevIsGuestRef = useRef(isGuest);

    // ====== STORAGE KEY STABLE THEO BROWSER (không phụ thuộc user) ======
    const [storageKeyPrefix] = useState(() => {
        try {
            const existing = localStorage.getItem("support_storage_key");
            if (existing) return existing;

            const baseId =
                user && (user.id || user.userId)
                    ? `u_${user.id || user.userId}`
                    : `session_${Math.random().toString(36).slice(2)}`;
            const key = `support_${baseId}`;
            localStorage.setItem("support_storage_key", key);
            return key;
        } catch {
            // fallback
            return "support_session_default";
        }
    });

    const sk = (k) => `${storageKeyPrefix}_${k}`;

    // ============== TTL helpers (15 phút) ==============
    const TTL_MS = 15 * 60 * 1000;

    function isExpiredAndCleanup() {
        try {
            const raw = localStorage.getItem(sk("expiredAt"));
            if (!raw) return false;
            const exp = Number(raw);
            if (!exp || Number.isNaN(exp)) return false;
            if (Date.now() > exp) {
                // Hết hạn -> clear tất cả state liên quan
                ["cid", "msgs", "step", "form", "expiredAt"].forEach((k) => {
                    localStorage.removeItem(sk(k));
                });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    function touchExpiry() {
        try {
            localStorage.setItem(sk("expiredAt"), String(Date.now() + TTL_MS));
        } catch { }
    }

    const guestClientRef = useRef(null);
    const guestSubRef = useRef(null);

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // De-dup state
    const seenServerIdsRef = useRef(new Set());
    const seenSigRef = useRef(new Set());
    const seenClientIdsRef = useRef(new Set());
    const pendingByClientIdRef = useRef(new Map());

    const [openState, setOpenState] = useState(() => {
        if (typeof controlledOpen === "boolean") return controlledOpen;
        try {
            return localStorage.getItem(sk("open")) === "1";
        } catch {
            return false;
        }
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
            try {
                localStorage.setItem(sk("open"), next ? "1" : "0");
            } catch { }
        }
        onOpenChange?.(next);
    };

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    // ===== Khởi tạo step / convId / form / messages CÓ CHECK HẾT HẠN =====
    const [step, setStep] = useState(() => {
        try {
            const expired = isExpiredAndCleanup();
            if (expired) return "form";

            const savedStep = localStorage.getItem(sk("step"));
            const savedCid = localStorage.getItem(sk("cid"));
            if (savedStep) return savedStep;
            if (savedCid) return "chat"; // có convId -> quay lại chat
            return "form";
        } catch {
            return "form";
        }
    });

    const [convId, setConvId] = useState(() => {
        try {
            const expired = isExpiredAndCleanup();
            if (expired) return null;
            const cid = localStorage.getItem(sk("cid"));
            return cid || null;
        } catch {
            return null;
        }
    });

    const [form, setForm] = useState(() => {
        try {
            const expired = isExpiredAndCleanup();
            const defaults = defaultsFromUser(user);
            if (expired) return defaults;
            const raw = localStorage.getItem(sk("form"));
            const saved = safeParse(raw);
            return saved ? { ...defaults, ...saved } : defaults;
        } catch {
            return defaultsFromUser(user);
        }
    });

    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const [messages, setMessages] = useState(() => {
        try {
            const expired = isExpiredAndCleanup();
            if (expired) return [];
            const raw = localStorage.getItem(sk("msgs"));
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [input, setInput] = useState("");
    const [attachments, setAttachments] = useState([]); // [{id,file,url,name,size,type}]
    const [reactionsByMsg, setReactionsByMsg] = useState({});

    // Persist
    useEffect(() => {
        try {
            localStorage.setItem(sk("step"), step);
        } catch { }
    }, [step, sk]);

    useEffect(() => {
        try {
            localStorage.setItem(sk("cid"), convId ?? "");
        } catch { }
    }, [convId, sk]);

    useEffect(() => {
        try {
            localStorage.setItem(sk("form"), JSON.stringify(form));
        } catch { }
    }, [form, sk]);

    useEffect(() => {
        try {
            localStorage.setItem(sk("msgs"), JSON.stringify(messages));
        } catch { }
    }, [messages, sk]);

    // Khi chuyển từ user thật -> guest (logout) => cho phép clear form + message (tùy ý)
    useEffect(() => {
        const wasGuest = prevIsGuestRef.current;
        if (!wasGuest && isGuest) {
            setForm({ fullName: "", phone: "", email: "" });
            try {
                // dọn rác key cũ, nhưng storageKeyPrefix hiện tại vẫn dùng cho session
                localStorage.removeItem(`support_guest_form`);
            } catch { }
            // nếu muốn giữ chat khi logout thì có thể bỏ 3 dòng dưới
            setStep("form");
            setConvId(null);
            setMessages([]);
            setReactionsByMsg({});
        }
        prevIsGuestRef.current = isGuest;
    }, [isGuest]);

    // Auto fill form khi có user
    useEffect(() => {
        if (step !== "form") return;
        const defaults = defaultsFromUser(user);
        setForm((prev) => {
            const empty = !prev || (!prev.fullName && !prev.phone && !prev.email);
            return empty ? defaults : prev;
        });
    }, [user, step]);

    // Đóng khi click ngoài / ESC (chỉ dùng cho mode standalone)
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
            clientId:
                m.clientId || m.clientMessageId || m.client_message_id || m.clientMsgId,
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

        // nếu đã hết hạn (do TTL) thì reset
        if (isExpiredAndCleanup()) {
            setStep("form");
            setConvId(null);
            setMessages([]);
            setReactionsByMsg({});
            return;
        }

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
                const mappedList = list.map(mapMessage);
                setMessages(mappedList);

                const seen = seenServerIdsRef.current;
                seen.clear();
                seenSigRef.current.clear();
                seenClientIdsRef.current.clear();

                const rx = {};
                mappedList.forEach((m) => {
                    const id = m.messageId || m.id || m.message_id;
                    if (id) seen.add(String(id));
                    const dtos = m.reactions || [];
                    if (id) rx[String(id)] = dtosToMap(dtos, currentUserId);
                });
                setReactionsByMsg(rx);

                // có message -> gia hạn TTL
                touchExpiry();
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convId, currentUserId]);

    // ===== Guest-only WebSocket
    useEffect(() => {
        if (!convId) return;

        // nếu hết hạn không cần sub nữa
        if (isExpiredAndCleanup()) return;

        try {
            guestSubRef.current?.unsubscribe?.();
            guestClientRef.current?.deactivate?.();
        } catch { }

        guestSubRef.current = null;
        guestClientRef.current = null;

        const c = new Client({
            webSocketFactory: () => new WebSocket(WS_URL),
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (s) => console.log("[WS-guest]", s),
        });

        c.onConnect = () => {
            guestSubRef.current = c.subscribe(
                `/topic/support.conversation.${convId}`,
                (m) => {
                    const evt = safeJson(m.body);
                    if (!evt) return;

                    // reaction.updated
                    if (evt?.type === "reaction.updated" || evt?.eventType === "reaction.updated") {
                        const d = evt.data || evt.payload || {};
                        if (String(d.conversationId) === String(convId) && d.messageId) {
                            setReactionsByMsg((prev) => ({
                                ...prev,
                                [String(d.messageId)]: dtosToMap(
                                    d.reactions || [],
                                    currentUserId
                                ),
                            }));
                        }
                        return;
                    }

                    const e = evt?.data ?? evt;
                    const rawMsg = e?.message ?? e;
                    const msg = rawMsg || {};

                    const serverId = String(
                        msg.messageId || msg.id || msg.message_id || msg.uuid || ""
                    );
                    const clientIdFromWs =
                        msg.clientId ||
                        msg.clientMessageId ||
                        msg.client_message_id ||
                        msg.clientMsgId;

                    // echo của optimistic
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
                                [String(mapped.messageId)]: dtosToMap(
                                    msg.reactions,
                                    currentUserId
                                ),
                            }));
                        }
                        touchExpiry();
                        return;
                    }

                    if (clientIdFromWs && seenClientIdsRef.current.has(String(clientIdFromWs))) {
                        return;
                    }

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
                            [String(mapped.messageId)]: dtosToMap(
                                msg.reactions,
                                currentUserId
                            ),
                        }));
                    }

                    // nhận được msg mới -> gia hạn TTL
                    touchExpiry();
                }
            );
        };
        c.onStompError = (f) =>
            console.error("[WS-guest] STOMP error:", f.headers?.message, f.body);
        c.onWebSocketClose = (e) =>
            console.warn("[WS-guest] Closed:", e?.code, e?.reason);
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
    }, [convId, currentUserId]);

    // Nhận WS từ global listener
    useEffect(() => {
        if (!incomingWSMsg || !convId) return;
        if (isExpiredAndCleanup()) return;

        if (
            incomingWSMsg?.type === "reaction.updated" ||
            incomingWSMsg?.eventType === "reaction.updated"
        ) {
            const d = incomingWSMsg.data || incomingWSMsg.payload || {};
            if (String(d.conversationId) === String(convId) && d.messageId) {
                setReactionsByMsg((prev) => ({
                    ...prev,
                    [String(d.messageId)]: dtosToMap(d.reactions || [], currentUserId),
                }));
            }
            return;
        }

        const { convId: wsConvId, msg } = normalizeWsEvent(incomingWSMsg);
        if (!wsConvId || String(wsConvId) !== String(convId)) return;

        const serverId = String(
            msg.messageId || msg.id || msg.message_id || msg.uuid || ""
        );
        const clientIdFromWs =
            msg.clientId || msg.clientMessageId || msg.client_message_id || msg.clientMsgId;

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
                    [String(mapped.messageId)]: dtosToMap(msg.reactions, currentUserId),
                }));
            }
            touchExpiry();
            return;
        }

        if (clientIdFromWs && seenClientIdsRef.current.has(String(clientIdFromWs))) {
            return;
        }

        if (serverId) {
            if (seenServerIdsRef.current.has(serverId)) return;
            seenServerIdsRef.current.add(serverId);
        } else {
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
                [String(mapped.messageId)]: dtosToMap(msg.reactions, currentUserId),
            }));
        }
        touchExpiry();
    }, [incomingWSMsg, convId, currentUserId, dispatch]);

    // Lắng lastReactionEvent từ Redux
    useEffect(() => {
        if (!lastReactionEvent || !convId) return;
        if (String(lastReactionEvent.conversationId) !== String(convId)) return;
        const mid = String(lastReactionEvent.messageId);
        setReactionsByMsg((prev) => ({
            ...prev,
            [mid]: dtosToMap(lastReactionEvent.reactions || [], currentUserId),
        }));
    }, [lastReactionEvent, convId, currentUserId]);

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

            touchExpiry();

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
        if (convId) {
            // nếu đang có conv nhưng lỡ hết hạn -> không dùng nữa
            if (isExpiredAndCleanup()) {
                setStep("form");
                setConvId(null);
                setMessages([]);
                setReactionsByMsg({});
                return null;
            }
            return convId;
        }
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

            touchExpiry();

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
        const results = await uploadMany(files, folder);
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
        // optimistic
        toggleLocalReaction(messageId, emoji);
        try {
            const list = await supportApi.toggleReaction(messageId, emoji);
            setReactionsByMsg((prev) => ({
                ...prev,
                [messageId]: dtosToMap(list, currentUserId),
            }));
            touchExpiry();
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

        // check lần nữa, phòng khi hết hạn lúc người dùng để tab mở lâu
        if (isExpiredAndCleanup()) {
            setStep("form");
            setConvId(null);
            setMessages((p) => [
                ...p,
                {
                    id: uid(),
                    role: "system",
                    ts: Date.now(),
                    content: "⚠️ Phiên chat đã hết hạn. Vui lòng tạo lại.",
                },
            ]);
            setReactionsByMsg({});
            return;
        }

        setInput("");

        const localAtts = attachments.slice();
        setAttachments([]);

        try {
            localAtts.forEach((a) => {
                if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
            });
        } catch { }

        const clientId = `c_${uid()}`;
        seenClientIdsRef.current.add(clientId);

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

            touchExpiry();

            if (res && (res.messageId || res.id)) {
                const idx = pendingByClientIdRef.current.get(clientId);
                if (typeof idx === "number") {
                    const mapped = mapMessage(res);
                    setMessages((prev) => {
                        const next = prev.slice();
                        next[idx] = mapped;
                        return next;
                    });
                    if (mapped.messageId && Array.isArray(res.reactions)) {
                        setReactionsByMsg((prev) => ({
                            ...prev,
                            [String(mapped.messageId)]: dtosToMap(
                                res.reactions,
                                currentUserId
                            ),
                        }));
                    }
                    pendingByClientIdRef.current.delete(clientId);
                    seenClientIdsRef.current.add(String(clientId));
                    const sid = String(
                        res.messageId || res.id || res.message_id || ""
                    );
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
                    <p className="text-sm text-gray-700">
                        Nhập thông tin để bắt đầu trò chuyện.
                    </p>

                    <div className="space-y-2">
                        <input
                            value={form.fullName}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, fullName: e.target.value }))
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Họ và tên"
                        />
                        {errors.fullName && (
                            <div className="text-xs text-red-600">{errors.fullName}</div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <input
                            value={form.phone}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, phone: e.target.value }))
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Số điện thoại"
                        />
                        {errors.phone && (
                            <div className="text-xs text-red-600">{errors.phone}</div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <input
                            value={form.email}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, email: e.target.value }))
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="Email (tuỳ chọn)"
                        />
                        {errors.email && (
                            <div className="text-xs text-red-600">{errors.email}</div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => {
                                // nếu muốn bắt buộc thông tin thì dùng: if (!validate()) return;
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
                <div
                    className="flex flex-col"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    ref={panelRef}
                >
                    {/* Messages */}
                    <ChatMessageList
                        listRef={listRef}
                        messages={messages}
                        currentUserId={currentUserId}
                        reactionsByMsg={reactionsByMsg}
                        SZ={SZ}
                        onReact={handleReact}
                    />

                    {/* Preview attachments chưa gửi */}
                    <AttachmentsPreview
                        attachments={attachments}
                        onRemove={removeAttachment}
                    />

                    {/* Input Bar */}
                    <ChatInputBar
                        input={input}
                        setInput={setInput}
                        inputRef={inputRef}
                        onSend={send}
                        onAddFiles={addFiles}
                    />
                </div>
            )}
        </>
    );

    if (mode === "embedded") {
        return (
            <div className={`bg-white ${SZ.panelW}`}>
                {showHeader && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 mt-1">
                        <div className="font-semibold text-gray-800">
                            Hỗ trợ khách hàng
                        </div>
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
                style={{
                    position: "fixed",
                    right: offset.right,
                    bottom: offset.bottom + 72,
                    zIndex: 9400,
                }}
                className={`${open
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 pointer-events-none translate-y-2"
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
