import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "@/utils/auth";
import { useDispatch, useSelector } from "react-redux";
import { notificationApi } from "@/services/notificationApi";
import { supportSliceActions } from "@/store/supportSlice";

export default function WebSocketListener() {
  const clientRef = useRef(null);        // giữ instance client
  const convoSubRef = useRef(null);      // sub riêng của hội thoại đang mở
  const activeIdRef = useRef(null);      // phản ánh activeConversationId hiện tại cho mọi callback

  const token = getAccessToken();
  const dispatch = useDispatch();

  const activeConversationId = useSelector((s) => s.support.activeConversationId);
  useEffect(() => {
    activeIdRef.current = activeConversationId != null ? String(activeConversationId) : null;
  }, [activeConversationId]);

  const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  // ===== Khởi tạo WebSocket (1 lần duy nhất) =====
  useEffect(() => {
    if (!token || clientRef.current) return;

    const client = new Client({
      webSocketFactory: () => new WebSocket(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (s) => console.log("[STOMP]", s),
    });

    client.onConnect = () => {
      console.log("[WS] ✅ Connected");

      /* ===== Notifications ===== */
      client.subscribe("/user/queue/notifications", (m) => {
        console.log("[WS] 🔔 Notification:", m.body);
        dispatch(
          notificationApi.util.invalidateTags(["UnreadCount", "Notifications"])
        );
      });

      /* ===== Support Chat: broadcast toàn hệ thống =====
         Tránh đẩy trùng cho hội thoại đang mở (đã có sub riêng) */
      client.subscribe("/topic/support", (m) => {
        const evt = safeJson(m.body);
        console.log("[WS] 💬 support.topic:", evt);
        if (!evt) return;

        // cố gắng rút conversationId từ nhiều cấu trúc payload
       const cidFromEvt =
         evt?.conversationId ??
         evt?.conversation?.id ??
        evt?.data?.conversationId ??
         evt?.data?.conversation?.id ??
       evt?.message?.conversationId ??
         evt?.data?.message?.conversationId ??
         null;

        // Nếu đúng hội thoại đang mở → bỏ qua ở kênh broadcast
        if (
          activeIdRef.current &&
          cidFromEvt != null &&
          String(cidFromEvt) === String(activeIdRef.current)
        ) {
          return;
        }

        dispatch(supportSliceActions.handleTopicEvent(evt));
      });

      /* ===== Support Chat: queue riêng cho admin/agent ===== */
      client.subscribe("/user/queue/support", (m) => {
        const evt = safeJson(m.body);
        console.log("[WS] 📩 support.queue:", evt);
        if (!evt) return;
        dispatch(supportSliceActions.handleQueueEvent(evt));
      });
    };

    client.onStompError = (f) =>
      console.error("[WS] ❌ STOMP error:", f.headers?.message, f.body);
    client.onWebSocketClose = (e) =>
      console.warn("[WS] ⚠️ Closed:", e?.code, e?.reason);
    client.onWebSocketError = (e) => console.error("[WS] 💥 Error:", e);

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        clientRef.current?.deactivate();
      } finally {
        clientRef.current = null;
      }
    };
  }, [token, WS_URL, dispatch]);

  // ===== Theo dõi hội thoại đang mở và sub topic riêng =====
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    // hủy sub cũ (nếu có)
    try {
      convoSubRef.current?.unsubscribe();
    } catch { }
    convoSubRef.current = null;

    if (!activeConversationId) return;

    // sub vào topic của CV đang mở
    convoSubRef.current = client.subscribe(
      `/topic/support.conversation.${activeConversationId}`,
      (m) => {
        const evt = safeJson(m.body);
        console.log("[WS] 🗨 conversation:", evt);
        if (!evt) return;
        // ✅ forward cả reaction.updated (và những event khác nếu sau này cần)
        const t = evt.type;
        if (
          t === "message.created" ||
          t === "reaction.updated" ||
          t === "conversation.updated" ||
          t === "conversation.assigned"
        ) {
          dispatch(supportSliceActions.handleTopicEvent(evt));
        }
      }
    );

    return () => {
      try {
        convoSubRef.current?.unsubscribe();
      } catch { }
      convoSubRef.current = null;
    };
  }, [activeConversationId, dispatch]);

  return null;
}

/* ===== Helper ===== */
function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
