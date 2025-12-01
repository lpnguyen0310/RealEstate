// src/components/ws/WebSocketListener.jsx
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useDispatch, useSelector } from "react-redux";
import { getAccessToken } from "@/utils/auth";
import { notificationApi } from "@/services/notificationApi";
import { supportSliceActions } from "@/store/supportSlice";

/* ===========================
   Helpers
=========================== */
function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/** Xin quyền notification 1 lần/khi cần */
function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      console.log("[Notify] Permission:", perm);
    });
  }
}

/** Hiển thị thông báo trình duyệt (đã chắc chắn đúng người nhận) */
function showBrowserNotification(payload) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;

  const title = payload?.title || "Thông báo mới";
  const body = payload?.message || payload?.body || "Bạn có thông báo mới.";
  const link = payload?.link || payload?.url || "/dashboard/notifications";
  const icon = `${window.location.origin}/bell.png`;

  try {
    console.log("[Notify] showBrowserNotification CALLED with:", payload);
    window.__ALLOW_NOTIFICATION__ = true;             // ✅ bật cờ
    const n = new window.Notification(title, { body, icon });
    window.__ALLOW_NOTIFICATION__ = false;            // ✅ tắt cờ
    n.onclick = () => {
      window.focus();
      window.location.href = link;
    };
  } catch (e) {
    window.__ALLOW_NOTIFICATION__ = false;
    console.error("[Notify] ❌ Không tạo được Notification:", e);
  }
}

/** Lấy receiverId từ payload với nhiều khả năng đặt tên khác nhau */
function extractReceiverId(payload) {
  if (!payload) return null;
  return (
    payload.receiverId ??
    payload.targetUserId ??
    payload.recipientId ??
    payload.userId ??
    payload?.receiver?.id ??
    payload?.targetUser?.id ??
    payload?.recipient?.id ??
    null
  );
}

export default function WebSocketListener() {
  const clientRef = useRef(null);   // giữ instance STOMP client
  const convoSubRef = useRef(null); // sub của hội thoại đang mở
  const activeIdRef = useRef(null); // cache id hội thoại đang mở cho callback

  const dispatch = useDispatch();
  const token = getAccessToken();

  // id user đang đăng nhập (dùng để so khớp receiver)
  const currentUserId = useSelector((s) => s.auth?.user?.id);
  const activeConversationId = useSelector(
    (s) => s.support.activeConversationId
  );

  // đồng bộ activeConversationId tới ref để callback có giá trị mới
  useEffect(() => {
    activeIdRef.current =
      activeConversationId != null ? String(activeConversationId) : null;
  }, [activeConversationId]);

  const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  /* ========== 0) Xin quyền notification ngay khi mount (nếu cần) ========== */
  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  /* ========== 1) Khởi tạo WebSocket một lần ========== */
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

      /* ===== Notifications (queue riêng theo user) ===== */
      client.subscribe("/user/queue/notifications", (m) => {
        const notif = safeJson(m.body) || { message: m.body };
        dispatch(notificationApi.util.invalidateTags(["UnreadCount", "Notifications"]));

        const receiverId = extractReceiverId(notif);
        const uid = currentUserId;
        const canShow = receiverId != null && uid != null && String(receiverId) === String(uid);

        console.log("[Notify] decision => receiverId:", receiverId, " currentUserId:", uid, " canShow:", canShow);
        if (!canShow) return;

        // (tuỳ chọn) nếu tab đang visible thì bỏ qua
        // if (document.visibilityState === "visible") return;

        showBrowserNotification(notif);
      });

      client.subscribe("/topic/support", (m) => {
        const evt = safeJson(m.body);
        if (!evt) return;

        const cidFromEvt =
          evt?.conversationId ??
          evt?.conversation?.id ??
          evt?.data?.conversationId ??
          evt?.data?.conversation?.id ??
          evt?.message?.conversationId ??
          evt?.data?.message?.conversationId ??
          null;

        if (
          activeIdRef.current &&
          cidFromEvt != null &&
          String(cidFromEvt) === String(activeIdRef.current)
        ) {
          return; // đã sub kênh riêng, bỏ qua broadcast
        }

        dispatch(supportSliceActions.handleTopicEvent(evt));
      });

      /* ===== Support Chat: queue riêng (agent/admin) ===== */
      client.subscribe("/user/queue/support", (m) => {
        const evt = safeJson(m.body);
        if (!evt) return;
        dispatch(supportSliceActions.handleQueueEvent(evt));
      });
    };

    client.onStompError = (f) =>
      console.error("[WS] ❌ STOMP error:", f.headers?.message, f.body);
    client.onWebSocketClose = (e) =>
      console.warn("[WS] ⚠️ Closed:", e?.code, e?.reason);
    client.onWebSocketError = (e) =>
      console.error("[WS] 💥 Error:", e);

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        clientRef.current?.deactivate();
      } finally {
        clientRef.current = null;
      }
    };
  }, [token, WS_URL, dispatch, currentUserId]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    try {
      convoSubRef.current?.unsubscribe();
    } catch { }
    convoSubRef.current = null;

    if (!activeConversationId) return;

    // sub topic riêng của hội thoại đang mở
    convoSubRef.current = client.subscribe(
      `/topic/support.conversation.${activeConversationId}`,
      (m) => {
        const evt = safeJson(m.body);
        if (!evt) return;

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
