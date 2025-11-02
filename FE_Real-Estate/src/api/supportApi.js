// src/services/supportApi.js
import api from "@/api/axios"; // axios đã cấu hình baseURL + token interceptor

export const supportApi = {
    // Khách hoặc user: tạo hội thoại
    createConversation(payload) {
        // payload: {subject, guestName, guestPhone, guestEmail}
        return api.post("/support/conversations", payload).then((r) => r.data);
    },

    // Admin/Agent: list theo tab (all|unassigned|mine)
    listConversations({ tab = "all", q = "", page = 0, size = 30 } = {}) {
        return api
            .get("/support/conversations", { params: { tab, q, page, size } })
            .then((r) => r.data);
    },

    // Lấy lịch sử tin nhắn 1 CV
    fetchMessages({ conversationId, page = 0, size = 50 }) {
        return api
            .get("/support/messages", { params: { conversationId, page, size } })
            .then((r) => r.data);
    },

    // Gửi tin nhắn (cả ADMIN/CUSTOMER) — giữ nguyên payload để mang clientId/clientMsgId
    sendMessage(payload) {
        // payload: { conversationId, content, attachments, clientId, clientMessageId, clientMsgId }
        return api.post("/support/messages", payload).then((r) => r.data);
    },

    // Admin nhận xử lý CV
    assignToMe(conversationId) {
        return api
            .post(`/support/conversations/${conversationId}/assign`)
            .then((r) => r.data);
    },

    // Đánh dấu đã đọc
    markRead({ conversationId, who }) {
        return api
            .post(`/support/read-receipts`, null, { params: { conversationId, who } })
            .then((r) => r.data);
    },

    deleteConversation(conversationId) {
        return api.delete(`/support/conversations/${conversationId}`).then(r => r.data);
    },

    toggleReaction(messageId, emoji) {
        return api
            .post("/support/reactions/toggle", null, { params: { messageId, emoji } })
            .then((r) => r.data);
    },
};
