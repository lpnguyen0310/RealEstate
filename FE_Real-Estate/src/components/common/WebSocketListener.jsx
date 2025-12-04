import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getAccessToken } from "@/utils/auth";
import { notificationApi } from "@/services/notificationApi";
import { supportSliceActions } from "@/store/supportSlice";
import { logoutThunk } from "@/store/authSlice";
import ForceLogoutModal from "@/components/common/ForceLogoutModal";

function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Show notification permission request one time
function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      console.log("[Notify] Permission:", perm);
    });
  }
}

// Show browser notification (ensured to be for the correct recipient)
function showBrowserNotification(payload) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;

  const title = payload?.title || "Thông báo mới";
  const body = payload?.message || payload?.body || "Bạn có thông báo mới.";
  const link = payload?.link || payload?.url || "/dashboard/notifications";
  const icon = `${window.location.origin}/bell.png`;

  try {
    console.log("[Notify] showBrowserNotification CALLED with:", payload);
    window.__ALLOW_NOTIFICATION__ = true; // bật cờ cho patch ở App.jsx
    const n = new window.Notification(title, { body, icon });
    window.__ALLOW_NOTIFICATION__ = false; // tắt lại
    n.onclick = () => {
      window.focus();
      window.location.href = link;
    };
  } catch (e) {
    window.__ALLOW_NOTIFICATION__ = false;
    console.error("[Notify] ❌ Không tạo được Notification:", e);
  }
}

// Extract receiverId from various possible payload structures
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
  const clientRef = useRef(null);   // WebSocket client STOMP
  const convoSubRef = useRef(null); // subscription 
  const activeIdRef = useRef(null); // active conversationId

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = getAccessToken();

  const currentUserId = useSelector((s) => s.auth?.user?.id);
  const activeConversationId = useSelector(
    (s) => s.support.activeConversationId
  );

  // ======= state for force logout modal (reset / locked) =======
  const [forceOpen, setForceOpen] = useState(false);
  const [forceType, setForceType] = useState(null);       // "reset" | "locked"
  const [forceMessage, setForceMessage] = useState("");

  const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  // synchronize conversationId into ref
  useEffect(() => {
    activeIdRef.current =
      activeConversationId != null ? String(activeConversationId) : null;
  }, [activeConversationId]);

  // request notification permission one time
  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  // ======= LOGOUT FUNCTION =======
  const handleLogout = useCallback(() => {
    dispatch(logoutThunk());
    setForceOpen(false);
    navigate("/login");
  }, [dispatch, navigate]);

  /* ========== 1) Initialize WebSocket once ========== */
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

      /* ===== Notifications (user-specific queue) ===== */
      client.subscribe("/user/queue/notifications", (m) => {
        const notif = safeJson(m.body) || { message: m.body };
        console.log("[Notify] Received:", notif);

        // invalid cache notification list/unread
        dispatch(
          notificationApi.util.invalidateTags([
            "UnreadCount",
            "Notifications",
          ])
        );

        const receiverId = extractReceiverId(notif);
        const uid = currentUserId;
        const canShow =
          receiverId != null &&
          uid != null &&
          String(receiverId) === String(uid);

        console.log(
          "[Notify] decision => receiverId:",
          receiverId,
          " currentUserId:",
          uid,
          " canShow:",
          canShow
        );
        if (!canShow) return;

        // 🔐 1. Password reset by admin
        if (notif.type === "USER_PASSWORD_RESET_BY_ADMIN") {
          setForceType("reset");
          setForceMessage(
            notif.message ||
            "Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại. Vui lòng đăng nhập lại bằng mật khẩu mới được gửi qua email."
          );
          setForceOpen(true);
          return;
        }

        // 🔐 2. Account locked by admin
        if (notif.type === "USER_LOCKED_BY_ADMIN") {
          setForceType("locked");
          setForceMessage(
            notif.message ||
            "Tài khoản của bạn đã bị khóa bởi quản trị viên. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ."
          );
          setForceOpen(true);
          return;
        }

        // 🔔 3. Other types of notifications → browser notification as before
        showBrowserNotification(notif);
      });

      /* ===== Common support topic ===== */
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
          // đã sub kênh riêng rồi, bỏ broadcast
          return;
        }

        dispatch(supportSliceActions.handleTopicEvent(evt));
      });

      /* ===== Common support queue (agent/admin) ===== */
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
  }, [token, WS_URL, dispatch, currentUserId, handleLogout]);

  // Subscribe to the currently open conversation
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    try {
      convoSubRef.current?.unsubscribe();
    } catch { }
    convoSubRef.current = null;

    if (!activeConversationId) return;

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

  return (
    <>
      <ForceLogoutModal
        open={forceOpen}
        type={forceType}         // "reset" hoặc "locked"
        message={forceMessage}
        onLogout={handleLogout}
        seconds={10}
      />
    </>
  );
}
