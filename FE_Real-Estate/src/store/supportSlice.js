// src/store/supportSlice.js
import { createSlice } from "@reduxjs/toolkit";

/** Giới hạn bộ nhớ cho tập id/sig đã thấy (chống phình) */
const SEEN_LIMIT = 300;

const initialState = {
    conversations: [],            // danh sách sidebar
    activeConversationId: null,   // id hội thoại đang mở (string)
    unreadCount: 0,               // tổng badge global (tùy dùng)

    // tín hiệu realtime đẩy ra UI thread
    incomingMessage: null,        // raw event message để AdminSupport append
    lastReactionEvent: null,      // {messageId, conversationId, reactions}

    // stores phục vụ de-dupe & optimistic
    seenMsgIds: {},               // { [messageIdOrSignature]: true }
    seenQueue: [],                // FIFO để cắt giảm theo SEEN_LIMIT
    pendingByClientId: {},        // { [clientMsgId]: optimisticPayload }
};

/* ===================== Helpers ===================== */
function asStr(v) {
    return v != null ? String(v) : null;
}

// Tạo chữ ký cho message chưa có messageId (1 số BE gửi trước id)
function makeSignature(data) {
    const cid = asStr(data?.conversationId) ?? "_";
    const sid = asStr(data?.senderId) ?? "_";
    const role = data?.senderRole ?? data?.role ?? "_";
    const content = (data?.content ?? "").slice(0, 200);
    const ts = data?.createdAt ?? data?.ts ?? "_";
    return `${cid}|${sid}|${role}|${content}|${ts}`;
}

function rememberSeen(state, key) {
    if (!key || state.seenMsgIds[key]) return;
    state.seenMsgIds[key] = true;
    state.seenQueue.push(key);
    if (state.seenQueue.length > SEEN_LIMIT) {
        const drop = state.seenQueue.splice(0, state.seenQueue.length - SEEN_LIMIT);
        for (const k of drop) delete state.seenMsgIds[k];
    }
}

/** Cập nhật/chen hội thoại khi có message mới (dùng cho message.created) */
function upsertConvPreview(state, cid, { preview, at, isActive }) {
    if (!cid) return;

    let touched = false;
    state.conversations = (state.conversations || []).map((c) => {
        if (asStr(c?.conversationId) !== cid) return c;
        touched = true;

        const currentUnread = c.unreadForAssignee ?? c.unread ?? 0;
        const nextUnread = isActive ? 0 : currentUnread + 1;

        return {
            ...c,
            lastMessagePreview: preview,
            lastMessageAt: at,
            unreadForAssignee: nextUnread,
            unread: nextUnread,
            status: c.status || "OPEN",
        };
    });

    if (!touched) {
        state.conversations.unshift({
            conversationId: cid,
            status: "OPEN",
            lastMessagePreview: preview,
            lastMessageAt: at,
            unreadForAssignee: isActive ? 0 : 1,
            unread: isActive ? 0 : 1,
        });
    }

    state.conversations.sort(
        (a, b) => new Date(b?.lastMessageAt || 0) - new Date(a?.lastMessageAt || 0)
    );
}

/** Gộp cập nhật khi nhận event conversation.updated */
function mergeConversationUpdate(state, data, { isActive }) {
    const cid = asStr(data?.conversationId ?? data?.id);
    if (!cid) return;

    const nextPreview =
        data?.lastMessagePreview ?? data?.lastMessage ?? data?.preview ?? "";
    const nextAt = data?.lastMessageAt ?? data?.updatedAt ?? Date.now();

    let found = false;
    state.conversations = (state.conversations || []).map((c) => {
        if (asStr(c?.conversationId) !== cid) return c;
        found = true;

        // unread server có thể trả, nếu không thì giữ cũ
        let unread = c.unreadForAssignee ?? c.unread ?? 0;
        if (typeof data?.unreadForAssignee === "number") {
            unread = data.unreadForAssignee;
        }
        if (isActive) unread = 0;

        return {
            ...c,
            customerName: data?.customerName ?? c.customerName,
            customerPhone: data?.customerPhone ?? c.customerPhone,
            customerEmail: data?.customerEmail ?? c.customerEmail,
            status: data?.status ?? c.status,
            assigneeId: data?.assigneeId ?? c.assigneeId,
            lastMessagePreview: nextPreview,
            lastMessageAt: nextAt,
            unreadForAssignee: unread,
            unread,
        };
    });

    if (!found) {
        state.conversations.unshift({
            conversationId: cid,
            customerName: data?.customerName,
            customerPhone: data?.customerPhone,
            customerEmail: data?.customerEmail,
            status: data?.status ?? "OPEN",
            assigneeId: data?.assigneeId ?? null,
            lastMessagePreview: nextPreview,
            lastMessageAt: nextAt,
            unreadForAssignee: isActive ? 0 : (data?.unreadForAssignee ?? 1),
            unread: isActive ? 0 : (data?.unreadForAssignee ?? 1),
        });
    }

    state.conversations.sort(
        (a, b) => new Date(b?.lastMessageAt || 0) - new Date(a?.lastMessageAt || 0)
    );
}

/* ===================== Slice ===================== */
const supportSlice = createSlice({
    name: "support",
    initialState,
    reducers: {
        setConversations(state, { payload }) {
            state.conversations = payload || [];
        },
        setActive(state, { payload }) {
            state.activeConversationId = asStr(payload);
        },

        /** Gọi khi click Send (optimistic) để cập nhật sidebar tức thì */
        addPendingMessage(state, { payload }) {
            const cid = asStr(payload?.conversationId);
            const clientMsgId = payload?.clientMsgId;
            if (!clientMsgId) return;

            state.pendingByClientId[clientMsgId] = payload;

            if (cid) {
                upsertConvPreview(state, cid, {
                    preview: payload?.content || "[Tệp]",
                    at: payload?.ts ?? Date.now(),
                    isActive: cid === state.activeConversationId,
                });

                if (cid === state.activeConversationId) {
                    state.incomingMessage = { ...payload, _optimistic: true };
                }
            }
        },

        /** Nhận event từ WS (broadcast + topic riêng) */
        handleTopicEvent(state, { payload }) {
            // payload có thể là {type, data} hoặc message trần
            const type = payload?.type;
            const data = payload?.data ?? payload ?? {};
            const cid = asStr(data?.conversationId ?? data?.id);

            // Nếu không có type mà lại giống message trần -> map sang message.created
            const looksLikeRawMsg =
                !type &&
                (data?.messageId || data?.id) &&
                (data?.content || data?.attachments) &&
                data?.conversationId;

            const finalType = type || (looksLikeRawMsg ? "message.created" : "unknown");

            switch (finalType) {
                case "conversation.created": {
                    // chen lên đầu nếu chưa có
                    const exist = (state.conversations || []).some(
                        (c) => asStr(c?.conversationId) === cid
                    );
                    if (!exist) state.conversations.unshift(data);
                    // sort theo lastMessageAt nếu có
                    state.conversations.sort(
                        (a, b) =>
                            new Date(b?.lastMessageAt || 0) - new Date(a?.lastMessageAt || 0)
                    );
                    break;
                }

                case "conversation.assigned": {
                    state.conversations = (state.conversations || []).map((c) =>
                        asStr(c?.conversationId) === cid ? { ...c, ...data } : c
                    );
                    break;
                }

                case "conversation.updated": {
                    mergeConversationUpdate(state, data, {
                        isActive: cid && cid === state.activeConversationId,
                    });
                    break;
                }

                case "reaction.updated": {
                    const mid = asStr(data?.messageId);
                    const cvId = asStr(data?.conversationId);
                    const reactions = Array.isArray(data?.reactions) ? data.reactions : [];
                    state.lastReactionEvent = { messageId: mid, conversationId: cvId, reactions };
                    break;
                }

                case "message.created": {
                    // 1) Nếu là phản hồi của bóng (có clientMsgId trùng), thay thế bóng
                    const clientMsgId = data?.clientMsgId;
                    if (clientMsgId && state.pendingByClientId[clientMsgId]) {
                        const msgId = data?.messageId ?? data?.id;
                        const key = msgId ? String(msgId) : makeSignature(data);
                        rememberSeen(state, key);

                        if (cid && cid === state.activeConversationId) {
                            state.incomingMessage = { ...data, _replaceClientMsgId: clientMsgId };
                        }
                        delete state.pendingByClientId[clientMsgId];

                        upsertConvPreview(state, cid, {
                            preview: data?.content || "[Tệp]",
                            at: data?.createdAt ?? data?.ts ?? Date.now(),
                            isActive: cid === state.activeConversationId,
                        });
                        break;
                    }

                    // 2) De-dupe liên kênh
                    const msgId = data?.messageId ?? data?.id;
                    const key = msgId ? String(msgId) : makeSignature(data);
                    if (state.seenMsgIds[key]) break;
                    rememberSeen(state, key);

                    // 2.a) nếu đang mở hội thoại → đẩy vào UI
                    if (cid && cid === state.activeConversationId) {
                        state.incomingMessage = data;
                    }

                    // 2.b) luôn cập nhật preview + unread sidebar
                    upsertConvPreview(state, cid, {
                        preview: data?.content || "[Tệp]",
                        at: data?.createdAt ?? data?.ts ?? Date.now(),
                        isActive: cid === state.activeConversationId,
                    });
                    break;
                }

                case "conversation.deleted": {
                    const delId = asStr(data?.conversationId ?? data?.id);
                    if (!delId) break;
                    state.conversations = (state.conversations || []).filter(
                        (c) => asStr(c?.conversationId) !== delId
                    );
                    if (state.activeConversationId === delId) {
                        state.activeConversationId = null;
                    }
                    break;
                }

                default:
                    // bỏ qua các loại khác/không nhận diện
                    break;
            }
        },

        /** Hàng đợi riêng (ví dụ đếm badge tổng) */
        handleQueueEvent(state, { payload }) {
            if (payload?.type === "message.created") state.unreadCount += 1;
        },

        clearUnread(state) {
            state.unreadCount = 0;
        },
    },
});

export const supportSliceActions = supportSlice.actions;
export default supportSlice.reducer;
