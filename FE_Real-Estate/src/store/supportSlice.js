// src/store/supportSlice.js
import { createSlice } from "@reduxjs/toolkit";

/** Giới hạn số id đã thấy để tránh phình bộ nhớ */
const SEEN_LIMIT = 300;

const initialState = {
    conversations: [],
    activeConversationId: null,   // lưu dạng string để so sánh ổn định
    unreadCount: 0,
    incomingMessage: null,
    lastReactionEvent: null,
    // Dedupe store
    seenMsgIds: {},   // { [messageIdOrSig]: true }
    seenQueue: [],    // FIFO các id/sig đã lưu để trim theo SEEN_LIMIT
    pendingByClientId: {},
};

function asStr(v) {
    return v != null ? String(v) : null;
}

function makeSignature(data) {
    // phòng khi BE không trả messageId → tạo chữ ký tạm đủ phân biệt
    // chỉnh tuỳ BE: thêm createdAt / attachmentsLength nếu cần
    const cid = asStr(data?.conversationId) ?? "_";
    const sid = asStr(data?.senderId) ?? "_";
    const role = data?.senderRole ?? data?.role ?? "_";
    const content = (data?.content ?? "").slice(0, 200); // cắt ngắn để an toàn
    const ts = data?.createdAt ?? data?.ts ?? "_";
    return `${cid}|${sid}|${role}|${content}|${ts}`;
}

function rememberSeen(state, key) {
    if (!key) return;
    if (state.seenMsgIds[key]) return;         // đã thấy
    state.seenMsgIds[key] = true;
    state.seenQueue.push(key);
    // cắt bớt nếu quá limit
    if (state.seenQueue.length > SEEN_LIMIT) {
        const drop = state.seenQueue.splice(0, state.seenQueue.length - SEEN_LIMIT);
        for (const k of drop) delete state.seenMsgIds[k];
    }
}

const supportSlice = createSlice({
    name: "support",
    initialState,
    reducers: {
        setConversations(state, { payload }) { state.conversations = payload || []; },
        setActive(state, { payload }) { state.activeConversationId = asStr(payload); },

        // gọi ngay khi click Send để tạo bóng (optimistic)
        addPendingMessage(state, { payload }) {
            const cid = asStr(payload?.conversationId);
            const clientMsgId = payload?.clientMsgId;
            if (!clientMsgId) return;

            state.pendingByClientId[clientMsgId] = payload;

            // để widget biết append (nếu bạn đang lắng `incomingMessage`)
            if (cid && cid === state.activeConversationId) {
                state.incomingMessage = { ...payload, _optimistic: true };
            }
        },

        handleTopicEvent(state, { payload }) {
            const type = payload?.type;
            const data = payload?.data ?? {};
            const cid = asStr(data?.conversationId);

            switch (type) {
                case "conversation.created": {
                    state.conversations = [data, ...(state.conversations || [])];
                    break;
                }
                case "reaction.updated": {
                    const data = payload?.data ?? payload; // đề phòng WS gói bọc
                    const mid = String(data?.messageId);
                    const cid = String(data?.conversationId);
                    const reactions = data?.reactions || [];

                    // Cho UI chủ động nghe & update: đẩy 1 sự kiện nhẹ
                    state.lastReactionEvent = { messageId: mid, conversationId: cid, reactions };
                    break;
                }
                case "conversation.assigned": {
                    state.conversations = (state.conversations || []).map((c) =>
                        asStr(c?.conversationId) === cid ? data : c
                    );
                    break;
                }
                case "message.created": {
                    // 1) Nếu có clientMsgId khớp pending → coi như “deliver”:
                    const clientMsgId = data?.clientMsgId;
                    if (clientMsgId && state.pendingByClientId[clientMsgId]) {
                        // Đánh dấu là đã thấy để tránh bị kênh khác đổ về lần nữa
                        const msgId = data?.messageId ?? data?.id;
                        const key = msgId ? String(msgId) : makeSignature(data);
                        rememberSeen(state, key);

                        // Thông báo cho UI thay thế bóng bằng bản chính thức
                        if (cid && cid === state.activeConversationId) {
                            state.incomingMessage = { ...data, _replaceClientMsgId: clientMsgId };
                        }
                        delete state.pendingByClientId[clientMsgId];
                        break;
                    }

                    // 2) Không có clientMsgId (hoặc không pending) → dùng cơ chế seen để khử trùng lặp liên kênh
                    const msgId = data?.messageId ?? data?.id;
                    const key = msgId ? String(msgId) : makeSignature(data);
                    if (state.seenMsgIds[key]) break;
                    rememberSeen(state, key);

                    if (cid && cid === state.activeConversationId) {
                        state.incomingMessage = data;
                    }
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
                    break;
            }
        },

        handleQueueEvent(state, { payload }) {
            if (payload?.type === "message.created") state.unreadCount += 1;
        },
        clearUnread(state) { state.unreadCount = 0; },
    },
});

export const supportSliceActions = supportSlice.actions;
export default supportSlice.reducer;