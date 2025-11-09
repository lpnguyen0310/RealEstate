// src/pages/admin/support/AdminSupport.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { supportSliceActions } from "@/store/supportSlice";
import { supportApi } from "@/api/supportApi";
import { uploadMany } from "@/api/cloudinary";

/* ===================== Utils ===================== */
const fmt = (ts) => new Date(ts).toLocaleTimeString("vi-VN");
const formatBytes = (b = 0) => {
    if (!b) return "0 B";
    const k = 1024, u = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${u[i]}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);

const TabBtn = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={[
            "px-3 py-1.5 rounded-lg text-sm transition border",
            active
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300",
        ].join(" ")}
        aria-pressed={active}
    >
        <span className={active ? "text-white" : "text-inherit"}>{children}</span>
    </button>
);

function Toast({ open, type = "success", message, onClose }) {
    if (!open) return null;
    const color =
        type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-gray-800";
    return (
        <div className="fixed top-4 right-4 z-[1100]">
            <div className={`text-white ${color} rounded-xl px-4 py-2 shadow-lg`}>{message}</div>
        </div>
    );
}

/* Confirm Modal */
function ConfirmDeleteModal({
    open,
    title = "Xóa hội thoại",
    message = "Bạn có chắc muốn xóa hội thoại này? Hành động không thể hoàn tác.",
    onClose,
    onConfirm,
    loading,
}) {
    const escHandler = (e) => e.key === "Escape" && onClose?.();
    useEffect(() => {
        if (!open) return;
        document.addEventListener("keydown", escHandler);
        return () => document.removeEventListener("keydown", escHandler);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onClose} />
            <div className="relative w-full sm:w:[440px] sm:w-[440px] mx-3 sm:mx-0 rounded-2xl bg-white shadow-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 h-10 w-10 grid place-items-center rounded-full bg-rose-100 text-rose-600 text-xl">
                        ⚠️
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{message}</p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                        {loading ? "Đang xóa…" : "Xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Cloudinary helpers */
function clThumbFromUrl(secureUrl, { w = 520, h = 520, fit = "c_fill" } = {}) {
    if (!secureUrl) return secureUrl;
    return secureUrl.replace("/upload/", `/upload/${fit},w_${w},h_${h},q_auto,f_auto/`);
}
function clDownloadUrl(secureUrl, filename) {
    if (!secureUrl) return secureUrl;
    const flag = filename ? `fl_attachment:${encodeURIComponent(filename)}` : "fl_attachment";
    return secureUrl.replace("/upload/", `/upload/${flag}/`);
}
function isImage(att) {
    const mime = (att?.mimeType || "").toLowerCase();
    const name = (att?.name || "").toLowerCase();
    return mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

/* ===================== Chuẩn hoá dữ liệu ===================== */
function mapConversation(c) {
    return {
        id: c.conversationId || c.id,
        customerName: c.guestName || c.customerName || c.name,
        phone: c.guestPhone || c.phone,
        lastMessage: c.lastMessagePreview || c.lastMessage || c.preview || "",
        status: c.status,
        assigneeId: c.assigneeId ?? null,
        unread: c.unreadForAssignee ?? c.unreadCount ?? c.unread ?? 0,
        updatedAt: c.lastMessageAt ? Date.parse(c.lastMessageAt) : c.updatedAt ? Date.parse(c.updatedAt) : Date.now(),
    };
}
function normalizeFromRedux(c) {
    const lmAt = c.lastMessageAt;
    const updatedAt =
        typeof lmAt === "number" ? lmAt : lmAt ? Date.parse(lmAt) : c.updatedAt ? Date.parse(c.updatedAt) : Date.now();

    return {
        id: c.conversationId || c.id,
        customerName: c.customerName || c.guestName || c.name,
        phone: c.customerPhone || c.guestPhone || c.phone,
        lastMessage: c.lastMessagePreview || c.lastMessage || c.preview || "",
        status: c.status,
        assigneeId: c.assigneeId ?? null,
        unread: c.unreadForAssignee ?? c.unreadCount ?? c.unread ?? 0,
        updatedAt,
    };
}
function mapMessage(m) {
    return {
        id: m.messageId || m.id,
        clientId: m.clientId || m.clientMessageId || m.client_message_id || m.clientMsgId,
        role: (m.senderRole || m.role) === "ADMIN" ? "admin" : "user",
        content: m.content || m.text || "",
        ts: m.createdAt ? Date.parse(m.createdAt) : m.ts || Date.now(),
        attachments: (m.attachments || []).map((a) => ({
            url: a.url,
            name: a.name,
            size: a.sizeBytes ?? a.size,
            mimeType: a.mimeType || "",
        })),
        conversationId: m.conversationId,
        reactions: Array.isArray(m.reactions) ? m.reactions.map((r) => ({ userId: r.userId, emoji: r.emoji })) : [],
    };
}

/* ===================== Filter sidebar theo tab ===================== */
function applyTabFilter(items, tab, meId, meEmail) {
    if (tab === "unassigned") return items.filter((x) => x.status === "UNASSIGNED");
    if (tab === "mine") {
        return items.filter((x) => {
            const byId = meId != null && x.assigneeId != null && String(x.assigneeId) === String(meId);
            const byEmail = meEmail && x.assigneeEmail && x.assigneeEmail.toLowerCase() === meEmail.toLowerCase();
            return (byId || byEmail) && x.status !== "RESOLVED";
        });
    }
    return items;
}

/* ===================== Reactions helpers ===================== */
function groupReactions(reactions = []) {
    const map = new Map();
    for (const r of reactions) {
        const e = r.emoji;
        if (!e) continue;
        let g = map.get(e);
        if (!g) {
            g = { emoji: e, count: 0, userIds: new Set() };
            map.set(e, g);
        }
        g.count += 1;
        if (r.userId != null) g.userIds.add(String(r.userId));
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}
const DEFAULT_REACTION_SET = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function AdminSupport() {
    const dispatch = useDispatch();

    // Realtime từ Redux
    const rtConvos = useSelector((s) => s.support?.conversations || []);
    const wsIncoming = useSelector((s) => s.support?.incomingMessage);
    const lastReactionEvent = useSelector((s) => s.support?.lastReactionEvent);

    // Admin hiện tại
    const me = useSelector((s) => s.auth?.user);
    const meId = me?.id || me?.userId || null;
    const meEmail = me?.email || null;

    const [tab, setTab] = useState("unassigned");
    const [q, setQ] = useState("");

    const [loadingList, setLoadingList] = useState(true);
    const [list, setList] = useState([]);

    const [sel, setSel] = useState(null);
    const [msgs, setMsgs] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const [attachments, setAttachments] = useState([]); // [{id,file,url,name,size,type}]
    const imgInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const [showEmoji, setShowEmoji] = useState(false);
    const emojiAnchorRef = useRef(null);
    const listRef = useRef(null);

    // Confirm delete
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busyDelete, setBusyDelete] = useState(false);
    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    // De-dupe
    const pendingByClientIdRef = useRef(new Map());
    const seenServerIdsRef = useRef(new Set());
    const seenSigRef = useRef(new Set());

    // Reaction picker state
    const [openReactionFor, setOpenReactionFor] = useState(null);

    // ===== NEW: Mobile Sidebar (Drawer) =====
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // đóng Drawer khi chọn hội thoại
    useEffect(() => {
        if (sel) setSidebarOpen(false);
    }, [sel]);

    /* ===================== Load danh sách ===================== */
    useEffect(() => {
        let mounted = true;
        setLoadingList(true);
        (async () => {
            try {
                const res = await supportApi.listConversations({ tab, q, page: 0, size: 50 });
                const raw = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
                const mapped = raw.map(mapConversation).sort((a, b) => b.updatedAt - a.updatedAt);

                if (mounted) {
                    setList(mapped);
                    // seed Redux
                    dispatch(
                        supportSliceActions.setConversations(
                            raw.map((c) => ({
                                conversationId: c.conversationId || c.id,
                                customerName: c.customerName || c.guestName || c.name,
                                customerPhone: c.customerPhone || c.guestPhone || c.phone,
                                customerEmail: c.customerEmail || c.guestEmail || c.email,
                                subject: c.subject,
                                status: c.status,
                                assigneeId: c.assigneeId ?? null,
                                lastMessagePreview: c.lastMessagePreview || c.lastMessage || c.preview || "",
                                lastMessageAt: c.lastMessageAt || c.updatedAt,
                                unreadForAssignee: c.unreadForAssignee ?? c.unreadCount ?? c.unread ?? 0,
                                unreadForCustomer: c.unreadForCustomer ?? 0,
                            }))
                        )
                    );
                }
            } finally {
                if (mounted) setLoadingList(false);
            }
        })();
        return () => (mounted = false);
    }, [tab, q, dispatch]);

    /* ===================== Merge realtime vào sidebar ===================== */
    useEffect(() => {
        if (!rtConvos) return;
        let normalized = rtConvos.map(normalizeFromRedux);

        const qLower = (q || "").trim().toLowerCase();
        if (qLower) {
            normalized = normalized.filter(
                (x) =>
                    (x.customerName || "").toLowerCase().includes(qLower) ||
                    (x.phone || "").toLowerCase().includes(qLower) ||
                    (x.lastMessage || "").toLowerCase().includes(qLower)
            );
        }

        const merged = applyTabFilter(normalized, tab, me?.id, meEmail).sort((a, b) => b.updatedAt - a.updatedAt);
        setList((prev) => {
            const sameLen = prev.length === merged.length;
            const same =
                sameLen &&
                prev.every(
                    (p, i) =>
                        p.id === merged[i].id &&
                        p.unread === merged[i].unread &&
                        p.status === merged[i].status &&
                        p.lastMessage === merged[i].lastMessage &&
                        p.updatedAt === merged[i].updatedAt
                );
            return same ? prev : merged;
        });
    }, [rtConvos, tab, q, me?.id, meEmail]);

    /* ===================== Chọn hội thoại -> load messages ===================== */
    useEffect(() => {
        if (!sel) return;
        let mounted = true;
        setLoadingMsgs(true);

        dispatch(supportSliceActions.setActive(sel.id));
        supportApi.markRead({ conversationId: sel.id, who: "ADMIN" }).catch(() => { });

        (async () => {
            try {
                const res = await supportApi.fetchMessages({ conversationId: sel.id, page: 0, size: 50 });
                const arr = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
                if (mounted) {
                    const mapped = arr.map(mapMessage);
                    setMsgs(mapped);

                    // reset de-dupe trackers
                    seenServerIdsRef.current.clear();
                    seenSigRef.current.clear();
                    pendingByClientIdRef.current.clear();
                    mapped.forEach((m) => m.id && seenServerIdsRef.current.add(String(m.id)));

                    // xóa badge
                    setList((p) => p.map((c) => (c.id === sel.id ? { ...c, unread: 0 } : c)));
                    // scroll bottom
                    setTimeout(() => {
                        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
                    }, 0);
                }
            } finally {
                if (mounted) setLoadingMsgs(false);
            }
        })();

        return () => (mounted = false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sel?.id]);

    /* ===================== Nhận realtime message ===================== */
    useEffect(() => {
        if (!wsIncoming || !sel?.id) return;
        if (wsIncoming._optimistic) return;

        if (wsIncoming._replaceClientMsgId) {
            const repId = wsIncoming._replaceClientMsgId;
            const idx = pendingByClientIdRef.current.get(repId);
            if (typeof idx === "number") {
                const mapped = mapMessage(wsIncoming);
                setMsgs((prev) => {
                    const next = prev.slice();
                    next[idx] = mapped;
                    return next;
                });
                pendingByClientIdRef.current.delete(repId);
                const sid = String(wsIncoming.messageId || wsIncoming.id || "");
                if (sid) seenServerIdsRef.current.add(sid);
                setList((p) =>
                    p
                        .map((cv) =>
                            cv.id === sel.id
                                ? { ...cv, lastMessage: mapped.content || "[Tệp]", updatedAt: Date.now(), unread: 0 }
                                : cv
                        )
                        .sort((a, b) => b.updatedAt - a.updatedAt)
                );
                setTimeout(() => {
                    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
                }, 0);
                return;
            }
        }

        const m = mapMessage(wsIncoming);
        if (!m.conversationId || m.conversationId !== sel.id) return;

        const serverId = String(m.id || "");
        const clientIdFromWs = m.clientId;

        if (serverId) {
            if (seenServerIdsRef.current.has(serverId)) return;
            seenServerIdsRef.current.add(serverId);
        } else {
            const sig = `${m.role}|${m.content}|${m.ts || 0}`;
            if (seenSigRef.current.has(sig)) return;
            seenSigRef.current.add(sig);
            setTimeout(() => seenSigRef.current.delete(sig), 8000);
        }

        if (clientIdFromWs && pendingByClientIdRef.current.has(clientIdFromWs)) {
            const idx = pendingByClientIdRef.current.get(clientIdFromWs);
            setMsgs((prev) => {
                const next = prev.slice();
                next[idx] = m;
                return next;
            });
            pendingByClientIdRef.current.delete(clientIdFromWs);
            supportApi.markRead({ conversationId: sel.id, who: "ADMIN" }).catch(() => { });
            setList((p) =>
                p
                    .map((cv) =>
                        cv.id === sel.id
                            ? {
                                ...cv,
                                lastMessage: m.content || "[Tệp]",
                                updatedAt: Date.now(),
                                unread: 0,
                            }
                            : cv
                    )
                    .sort((a, b) => b.updatedAt - a.updatedAt)
            );
            return;
        }

        setMsgs((p) => [...p, m]);
        setTimeout(() => {
            if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 0);
        supportApi.markRead({ conversationId: sel.id, who: "ADMIN" }).catch(() => { });
        setList((p) =>
            p
                .map((cv) =>
                    cv.id === sel.id
                        ? {
                            ...cv,
                            lastMessage: m.content || "[Tệp]",
                            updatedAt: Date.now(),
                            unread: 0,
                        }
                        : cv
                )
                .sort((a, b) => b.updatedAt - a.updatedAt)
        );
    }, [wsIncoming, sel?.id]);

    /* ===================== Lắng sự kiện WS: reaction.updated ===================== */
    useEffect(() => {
        if (!lastReactionEvent || !sel?.id) return;
        const { messageId, conversationId, reactions } = lastReactionEvent;
        if (String(conversationId) !== String(sel.id)) return;

        setMsgs((prev) =>
            prev.map((m) =>
                String(m.id) === String(messageId) ? { ...m, reactions: Array.isArray(reactions) ? reactions.slice() : [] } : m
            )
        );
    }, [lastReactionEvent, sel?.id]);

    /* ===================== Emoji click-outside ===================== */
    useEffect(() => {
        if (!showEmoji) return;
        const onDown = (e) => {
            const inBtn = emojiAnchorRef.current?.contains(e.target);
            const panel = document.getElementById("admin-emoji-panel");
            const inPanel = panel && panel.contains(e.target);
            if (!inBtn && !inPanel) setShowEmoji(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [showEmoji]);

    /* ===================== Attachments helpers ===================== */
    const addFiles = (files) => {
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
    };
    const removeAttachment = (id) =>
        setAttachments((p) => {
            const x = p.find((a) => a.id === id);
            if (x?.url?.startsWith("blob:")) try { URL.revokeObjectURL(x.url); } catch { }
            return p.filter((a) => a.id !== id);
        });

    async function uploadAttachments(localAttachments) {
        if (!localAttachments?.length) return [];
        const files = localAttachments.filter((a) => a.file).map((a) => a.file);
        if (!files.length) {
            return localAttachments.map((a) => ({
                url: a.url,
                name: a.name,
                sizeBytes: a.size,
                mimeType: a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
            }));
        }
        const folder = sel?.id ? `support/${sel.id}` : "support";
        const results = await uploadMany(files, folder);
        let j = 0;
        return localAttachments.map((a) => {
            if (!a.file) {
                return {
                    url: a.url,
                    name: a.name,
                    sizeBytes: a.size,
                    mimeType: a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
                };
            }
            const r = results[j++];
            return {
                url: r.secure_url,
                name: a.name,
                sizeBytes: a.size,
                mimeType: a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
                publicId: r.public_id,
                resourceType: r.resource_type,
            };
        });
    }

    /* ===================== Toast auto close ===================== */
    useEffect(() => {
        if (!toast.open) return;
        const t = setTimeout(() => setToast((p) => ({ ...p, open: false })), 2500);
        return () => clearTimeout(t);
    }, [toast.open]);

    /* ===================== Actions ===================== */
    async function onAssignMe() {
        if (!sel) return;
        await supportApi.assignToMe(sel.id);
        setList((p) => p.map((c) => (c.id === sel.id ? { ...c, status: "OPEN", assigneeId: meId, unread: 0 } : c)));
        setSel((s) => ({ ...s, status: "OPEN", assigneeId: meId }));
    }

    async function onSend() {
        const text = input.trim();
        if (!sel || (!text && attachments.length === 0)) return;
        setSending(true);
        const localAtts = attachments.slice();
        setAttachments([]);
        try {
            localAtts.forEach((a) => {
                if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
            });
        } catch { }
        const clientId = `c_${uid()}`;

        // optimistic
        const optimistic = {
            id: `tmp_${Date.now()}`,
            clientId,
            role: "admin",
            content: text,
            ts: Date.now(),
            attachments: localAtts.map((a) => ({
                url: a.url,
                name: a.name,
                size: a.size,
                mimeType: a.file?.type || (a.type === "image" ? "image/*" : "application/octet-stream"),
            })),
            reactions: [],
            conversationId: sel.id,
        };

        dispatch(
            supportSliceActions.addPendingMessage({
                conversationId: sel.id,
                content: text,
                clientMsgId: clientId,
                ts: optimistic.ts,
            })
        );
        setMsgs((p) => {
            const next = [...p, optimistic];
            pendingByClientIdRef.current.set(clientId, next.length - 1);
            return next;
        });
        setInput("");

        try {
            const uploaded = await uploadAttachments(localAtts);
            const res = await supportApi.sendMessage({
                conversationId: sel.id,
                content: text,
                attachments: uploaded,
                clientId,
                clientMessageId: clientId,
                clientMsgId: clientId,
            });

            if (res && (res.messageId || res.id)) {
                const idx = pendingByClientIdRef.current.get(clientId);
                if (typeof idx === "number") {
                    const mapped = mapMessage(res);
                    setMsgs((prev) => {
                        const next = prev.slice();
                        next[idx] = mapped;
                        return next;
                    });
                    pendingByClientIdRef.current.delete(clientId);

                    const sid = String(res.messageId || res.id || "");
                    if (sid) seenServerIdsRef.current.add(sid);

                    setList((p) =>
                        p
                            .map((cv) =>
                                cv.id === sel.id
                                    ? { ...cv, lastMessage: mapped.content || "[Tệp]", updatedAt: Date.now(), unread: 0 }
                                    : cv
                            )
                            .sort((a, b) => b.updatedAt - a.updatedAt)
                    );
                }
            }

            setTimeout(() => {
                if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
            }, 0);
        } finally {
            setSending(false);
        }
    }

    async function onToggleReaction(messageId, emoji) {
        if (!messageId || !emoji) return;
        const myId = String(meId ?? "");

        // Optimistic: 1 user chỉ có 1 reaction / message
        setMsgs((prev) =>
            prev.map((m) => {
                if (String(m.id) !== String(messageId)) return m;
                const old = Array.isArray(m.reactions) ? m.reactions : [];
                const mineIdx = old.findIndex((r) => String(r.userId) === myId);
                let next = [...old];

                if (mineIdx >= 0) {
                    if (next[mineIdx].emoji === emoji) {
                        next.splice(mineIdx, 1);
                    } else {
                        next[mineIdx] = { ...next[mineIdx], emoji };
                    }
                } else {
                    next.push({ userId: meId, emoji });
                }
                return { ...m, reactions: next };
            })
        );

        setOpenReactionFor(null);

        try {
            await supportApi.toggleReaction(messageId, emoji);
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteSingle(conversationId) {
        if (!conversationId) return;
        setBusyDelete(true);

        const prevList = list;
        const prevSel = sel;

        // optimistic
        setList((p) => p.filter((x) => x.id !== conversationId));
        if (sel?.id === conversationId) setSel(null);

        try {
            await supportApi.deleteConversation(conversationId);
            setConfirmOpen(false);
            setToast({
                open: true,
                type: "success",
                message: "Đã xóa hội thoại thành công.",
            });
        } catch (e) {
            // rollback
            setList(prevList);
            setSel(prevSel);

            const msg = e?.response?.data?.message || e?.message || "Xóa thất bại";
            alert(msg);
        } finally {
            setBusyDelete(false);
        }
    }

    /* ===================== UI ===================== */
    const tabs = useMemo(
        () => [
            { key: "unassigned", label: "Chưa nhận" },
            { key: "mine", label: "Của tôi" },
            { key: "all", label: "Tất cả" },
        ],
        []
    );

    return (
        <div className="w-full rounded-2xl border border-gray-200 overflow-hidden bg-white min-h-0 h-[90dvh] lg:h-[82vh]">
            {/* ===== Responsive grid: desktop 2 cột, mobile 1 cột với Drawer sidebar ===== */}
            <div className="h-full min-h-0 lg:grid lg:grid-cols-[320px_1fr]">
                {/* ===== Sidebar (Desktop) ===== */}
                <aside className="hidden lg:flex lg:flex-col lg:min-h-0 lg:border-r lg:border-gray-200">
                    <div className="px-3 py-3 border-b border-gray-200">
                        <div className="text-lg font-semibold">Hội thoại</div>
                        <div className="mt-2 flex gap-2">
                            {tabs.map((t) => (
                                <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                                    {t.label}
                                </TabBtn>
                            ))}
                        </div>
                        <div className="mt-3">
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Tìm tên/điện thoại/nội dung…"
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {q && (
                                    <button
                                        onClick={() => setQ("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {loadingList ? (
                            <div className="h-full grid place-items-center text-gray-500">Đang tải…</div>
                        ) : list.length === 0 ? (
                            <div className="h-full grid place-items-center text-gray-500">Không có hội thoại</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {list.map((cv) => (
                                    <li key={cv.id}>
                                        <button
                                            onClick={() => setSel(cv)}
                                            className={`w-full text-left px-3 py-3 flex gap-3 items-start hover:bg-gray-50 transition ${sel?.id === cv.id ? "bg-indigo-50" : ""
                                                }`}
                                        >
                                            <div className="shrink-0 h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
                                                {cv.customerName?.[0] || "K"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium truncate">{cv.customerName}</div>
                                                    {cv.unread > 0 && (
                                                        <span className="ml-1 inline-flex items-center justify-center text-[11px] px-1.5 h-5 rounded-full bg-rose-600 text-white">
                                                            {cv.unread}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`ml-auto text-[11px] px-1.5 py-0.5 rounded ${cv.status === "UNASSIGNED"
                                                                ? "bg-amber-100 text-amber-800"
                                                                : cv.status === "OPEN"
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-gray-200 text-gray-700"
                                                            }`}
                                                    >
                                                        {cv.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{cv.phone}</div>
                                                <div className="text-sm text-gray-700 truncate">{cv.lastMessage}</div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* ===== Thread / Nội dung (Cả mobile & desktop) ===== */}
                <section className="grid grid-rows-[56px_1fr_auto] min-h-0 h-full">
                    {/* Header Thread */}
                    <div className="h-14 border-b border-gray-200 px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
                        {/* Mobile: nút mở Sidebar + Back */}
                        <div className="lg:hidden flex items-center gap-2">
                            {!sel && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="h-9 px-3 rounded-lg border bg-white text-gray-700 text-sm"
                                    aria-label="Mở danh sách hội thoại"
                                >
                                    Hội thoại
                                </button>
                            )}
                            {sel && (
                                <button
                                    onClick={() => setSel(null)}
                                    className="h-9 px-3 rounded-lg border bg-white text-gray-700 text-sm"
                                    aria-label="Quay lại danh sách"
                                >
                                    ← Quay lại
                                </button>
                            )}
                        </div>

                        {sel ? (
                            <>
                                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
                                    {sel.customerName?.[0] || "K"}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold truncate">{sel.customerName}</div>
                                    <div className="text-xs text-gray-500 truncate">{sel.phone}</div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    {sel.status === "UNASSIGNED" && (
                                        <button
                                            onClick={onAssignMe}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                                        >
                                            Nhận
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirmOpen(true)}
                                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-50"
                                        disabled={busyDelete}
                                        title="Xóa hội thoại này"
                                    >
                                        Xóa
                                    </button>

                                    <span className="hidden sm:block text-[11px] text-gray-500">
                                        Cập nhật: {fmt(sel.updatedAt)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-500 hidden lg:block">Chọn một hội thoại bên trái</div>
                        )}
                    </div>

                    {/* Messages */}
                    <div
                        ref={listRef}
                        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 bg-gray-50"
                        style={{
                            // đảm bảo không bị che bởi safe-area khi có thanh điều hướng
                            paddingBottom: "env(safe-area-inset-bottom)",
                        }}
                    >
                        {sel ? (
                            loadingMsgs ? (
                                <div className="h-full grid place-items-center text-gray-500">Đang tải tin nhắn…</div>
                            ) : msgs.length === 0 ? (
                                <div className="h-full grid place-items-center text-gray-500">
                                    Chưa có tin nhắn trong hội thoại này
                                </div>
                            ) : (
                                msgs.map((m) => {
                                    const imgs = (m.attachments || []).filter((a) => isImage(a));
                                    const files = (m.attachments || []).filter((a) => !isImage(a));
                                    const hasText = !!(m.content || "").trim();
                                    const isAdmin = m.role === "admin";

                                    const rowClass = m.role === "admin" ? "flex justify-end mb-3" : "flex justify-start mb-3";
                                    const bubbleClass = `inline-block ${m.role === "admin" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                                        } rounded-2xl px-3 py-2 whitespace-pre-wrap break-words`;

                                    return (
                                        <div key={m.id || m.clientId} className={rowClass}>
                                            <div
                                                className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${m.role === "admin" ? "items-end" : "items-start"
                                                    }`}
                                            >
                                                {/* TEXT bubble + reaction button */}
                                                {hasText && (
                                                    <div className="relative group inline-block">
                                                        <div className={bubbleClass}>
                                                            <div className="text-sm leading-5">{m.content}</div>
                                                            <div
                                                                className={`mt-1 text-[10px] ${isAdmin ? "text-white/70 text-right" : "text-gray-500 text-left"
                                                                    } whitespace-nowrap leading-none`}
                                                            >
                                                                {fmt(m.ts)}
                                                            </div>
                                                        </div>

                                                        {/* Reaction trigger (bám cạnh bubble) */}
                                                        <button
                                                            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition
                              h-8 w-8 rounded-full bg-white shadow border grid place-items-center text-base
                              ${m.role === "admin" ? "left-0 -translate-x-full ml-2" : "right-0 translate-x-full mr-2"}`}
                                                            title="Thả cảm xúc"
                                                            onClick={() => setOpenReactionFor((prev) => (prev === m.id ? null : m.id))}
                                                        >
                                                            👍
                                                        </button>

                                                        {/* Quick picker (hover/nhấn) */}
                                                        {openReactionFor === m.id && (
                                                            <div
                                                                className={`absolute z-50 top-1/2 -translate-y-1/2 ${m.role === "admin" ? "left-0 -translate-x-full ml-3" : "right-0 translate-x-full mr-3"
                                                                    }`}
                                                                onMouseLeave={() => setOpenReactionFor(null)}
                                                            >
                                                                <div className="rounded-2xl bg-white shadow-xl border p-1 flex gap-1">
                                                                    {DEFAULT_REACTION_SET.map((em) => (
                                                                        <button
                                                                            key={em}
                                                                            className="h-9 w-9 grid place-items-center text-lg hover:scale-110 transition"
                                                                            onClick={() => onToggleReaction(m.id, em)}
                                                                        >
                                                                            {em}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* IMAGE gallery (ngoài bubble) */}
                                                {imgs.length > 0 && (
                                                    <div
                                                        className={`mt-2 grid gap-1 ${imgs.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                                            } ${m.role === "admin" ? "justify-items-end" : "justify-items-start"}`}
                                                    >
                                                        {imgs.map((a, idx) => {
                                                            const u = a.url;
                                                            const thumb = typeof u === "string" && u.includes("/upload/")
                                                                ? clThumbFromUrl(u, { w: 520, h: 520 })
                                                                : u;
                                                            const alt = a.name || `image_${idx + 1}`;
                                                            return (
                                                                <a
                                                                    key={idx}
                                                                    href={u}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="block overflow-hidden rounded-xl border bg-white"
                                                                    title={alt}
                                                                >
                                                                    <img src={thumb} alt={alt} className="max-h-[260px] w-full object-cover" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* FILE cards (ngoài bubble) */}
                                                {files.length > 0 && (
                                                    <div className="mt-2 flex flex-col gap-1 w-full">
                                                        {files.map((a, idx) => {
                                                            const href = a.url;
                                                            const downloadUrl =
                                                                typeof href === "string" && href.includes("/upload/")
                                                                    ? clDownloadUrl(href, a.name)
                                                                    : href;

                                                            const ext = (a.name || "").split(".").pop()?.toLowerCase();
                                                            let icon = "📄";
                                                            if (["pdf"].includes(ext)) icon = "📕";
                                                            else if (["doc", "docx"].includes(ext)) icon = "📘";
                                                            else if (["xls", "xlsx"].includes(ext)) icon = "📗";
                                                            else if (["ppt", "pptx"].includes(ext)) icon = "📙";

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-white ${m.role === "admin" ? "border-indigo-100" : "border-gray-200"
                                                                        }`}
                                                                >
                                                                    <span className="text-lg">{icon}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium truncate">
                                                                            <a
                                                                                href={href}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-indigo-600 hover:underline"
                                                                                title="Mở file"
                                                                            >
                                                                                {a.name || "file"}
                                                                            </a>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{formatBytes(a.size)}</div>
                                                                    </div>

                                                                    <a
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-gray-600 hover:text-indigo-700 text-base"
                                                                        title="Mở file"
                                                                    >
                                                                        📂
                                                                    </a>

                                                                    <a
                                                                        href={downloadUrl}
                                                                        download
                                                                        className="text-gray-600 hover:text-indigo-700 text-base"
                                                                        title="Tải xuống"
                                                                    >
                                                                        ⬇
                                                                    </a>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Reaction button cho msg không có text */}
                                                {!hasText && (
                                                    <div className={`relative group mt-1 ${m.role === "admin" ? "w-full flex justify-end" : ""}`}>
                                                        <button
                                                            className={`opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition
                              h-8 w-8 rounded-full bg-white shadow border grid place-items-center`}
                                                            title="Thả cảm xúc"
                                                            onClick={() => setOpenReactionFor((prev) => (prev === m.id ? null : m.id))}
                                                        >
                                                            👍
                                                        </button>

                                                        {openReactionFor === m.id && (
                                                            <div
                                                                className={`absolute z-50 -top-10 ${m.role === "admin" ? "right-0" : "left-0"}`}
                                                                onMouseLeave={() => setOpenReactionFor(null)}
                                                            >
                                                                <div className="rounded-2xl bg-white shadow-xl border p-1 flex gap-1">
                                                                    {DEFAULT_REACTION_SET.map((em) => (
                                                                        <button
                                                                            key={em}
                                                                            className="h-9 w-9 grid place-items-center text-lg hover:scale-110 transition"
                                                                            onClick={() => onToggleReaction(m.id, em)}
                                                                        >
                                                                            {em}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reaction chips */}
                                                {(() => {
                                                    const grouped = groupReactions(m.reactions || []);
                                                    if (!grouped.length) return null;
                                                    return (
                                                        <div
                                                            className={`mt-1 w-full flex flex-wrap gap-2 ${m.role === "admin" ? "justify-end" : "justify-start"
                                                                }`}
                                                        >
                                                            {grouped.map((gr) => {
                                                                const mine = gr.userIds?.has?.(String(meId));
                                                                const chipClass = mine
                                                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
                                                                return (
                                                                    <span
                                                                        key={gr.emoji}
                                                                        className={`px-2 h-7 inline-flex items-center gap-1 rounded-full text-xs border cursor-pointer select-none ${chipClass}`}
                                                                        onClick={() => onToggleReaction(m.id, gr.emoji)}
                                                                    >
                                                                        <span>{gr.emoji}</span>
                                                                        <span>{gr.count}</span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Timestamp khi chỉ có media/file */}
                                                {!hasText && (
                                                    <div className="mt-1 text-[10px] text-gray-500 whitespace-nowrap leading-none">{fmt(m.ts)}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            // Mobile: gợi ý mở sidebar
                            <div className="h-full grid place-items-center text-gray-500 lg:hidden">
                                Nhấn nút <b>Hội thoại</b> để chọn cuộc trò chuyện
                            </div>
                        )}
                    </div>

                    {/* Attachments preview (chưa gửi) */}
                    {!!attachments.length && (
                        <div className="px-3 sm:px-4 pb-2 bg-white max-h-36 overflow-y-auto">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {attachments.map((a) =>
                                    a.type === "image" ? (
                                        <div key={a.id} className="relative shrink-0">
                                            <img src={a.url} alt={a.name} className="w-20 h-20 object-cover rounded-lg border" />
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
                                            className="px-2 py-1 rounded-lg border text-xs flex items-center gap-2 bg-gray-50 shrink-0"
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

                    {/* Input bar */}
                    <div
                        className="border-t border-gray-200 p-2 sm:p-3 bg-white"
                        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
                    >
                        <div className="relative flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        onSend();
                                    }
                                }}
                                rows={1}
                                placeholder={sel ? "Nhập tin nhắn…" : "Chọn hội thoại để trả lời…"}
                                disabled={!sel}
                                className="flex-1 min-w-0 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                            />

                            {/* Emoji */}
                            <div className="relative">
                                <button
                                    ref={emojiAnchorRef}
                                    onClick={() => setShowEmoji((v) => !v)}
                                    className={`h-[38px] w-[38px] flex items-center justify-center rounded-xl ${showEmoji ? "bg-gray-200" : "bg-gray-50 hover:bg-gray-100"
                                        } text-lg`}
                                    title="Chèn emoji"
                                >
                                    😀
                                </button>
                                {showEmoji && (
                                    <div
                                        id="admin-emoji-panel"
                                        className="absolute bottom-[46px] right-0 z-50 shadow-xl border border-gray-200 rounded-2xl overflow-hidden bg-white"
                                    >
                                        <EmojiPicker
                                            onEmojiClick={(emoji) => setInput((v) => v + emoji.emoji)}
                                            theme="light"
                                            height={320}
                                            width={280}
                                            searchDisabled
                                            skinTonesDisabled
                                            lazyLoadEmojis
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Ảnh */}
                            <button
                                onClick={() => imgInputRef.current?.click()}
                                className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-base"
                                title="Gửi ảnh"
                            >
                                🖼️
                            </button>
                            <input
                                ref={imgInputRef}
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

                            {/* File */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-base"
                                title="Đính kèm tệp"
                            >
                                📎
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length) addFiles(files);
                                    e.target.value = "";
                                }}
                            />

                            {/* Gửi */}
                            <button
                                onClick={onSend}
                                disabled={!sel || sending || (!input.trim() && attachments.length === 0)}
                                className="h-[38px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* ===== Mobile Drawer (Sidebar) ===== */}
            <div
                className={`lg:hidden fixed inset-0 z-[1050] transition ${sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                aria-hidden={!sidebarOpen}
            >
                {/* backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setSidebarOpen(false)}
                />
                {/* sheet */}
                <div
                    className={`absolute left-0 top-0 h-full w-[86%] max-w-[360px] bg-white shadow-2xl border-r border-gray-200
          transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <div className="px-3 py-3 border-b border-gray-200 flex items-center gap-2">
                        <div className="text-base font-semibold">Hội thoại</div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto h-9 px-3 rounded-lg border bg-white text-gray-700 text-sm"
                        >
                            Đóng
                        </button>
                    </div>

                    <div className="px-3 py-2 border-b border-gray-200">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {tabs.map((t) => (
                                <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                                    {t.label}
                                </TabBtn>
                            ))}
                        </div>
                        <div className="mt-2">
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Tìm tên/điện thoại/nội dung…"
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {q && (
                                    <button
                                        onClick={() => setQ("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-[calc(100%-112px)] overflow-y-auto">
                        {loadingList ? (
                            <div className="h-full grid place-items-center text-gray-500">Đang tải…</div>
                        ) : list.length === 0 ? (
                            <div className="h-full grid place-items-center text-gray-500">Không có hội thoại</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {list.map((cv) => (
                                    <li key={cv.id}>
                                        <button
                                            onClick={() => setSel(cv)}
                                            className={`w-full text-left px-3 py-3 flex gap-3 items-start hover:bg-gray-50 transition ${sel?.id === cv.id ? "bg-indigo-50" : ""
                                                }`}
                                        >
                                            <div className="shrink-0 h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
                                                {cv.customerName?.[0] || "K"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium truncate">{cv.customerName}</div>
                                                    {cv.unread > 0 && (
                                                        <span className="ml-1 inline-flex items-center justify-center text-[11px] px-1.5 h-5 rounded-full bg-rose-600 text-white">
                                                            {cv.unread}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`ml-auto text-[11px] px-1.5 py-0.5 rounded ${cv.status === "UNASSIGNED"
                                                                ? "bg-amber-100 text-amber-800"
                                                                : cv.status === "OPEN"
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-gray-200 text-gray-700"
                                                            }`}
                                                    >
                                                        {cv.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{cv.phone}</div>
                                                <div className="text-sm text-gray-700 truncate">{cv.lastMessage}</div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal + Toast */}
            <ConfirmDeleteModal
                open={confirmOpen}
                title="Xóa hội thoại"
                message={`Bạn có chắc muốn xóa hội thoại${sel?.customerName ? ` với "${sel.customerName}"` : ""
                    }?`}
                onClose={() => !busyDelete && setConfirmOpen(false)}
                onConfirm={() => deleteSingle(sel?.id)}
                loading={busyDelete}
            />

            <Toast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast((p) => ({ ...p, open: false }))}
            />
        </div>
    );
}
