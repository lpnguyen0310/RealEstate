import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getAccessToken } from "@/utils/auth";
import { notificationApi } from "@/services/notificationApi";
import { supportSliceActions } from "@/store/supportSlice";
import { logoutThunk } from "@/store/authSlice";
import ForceLogoutModal from "@/components/common/ForceLogoutModal";
import AppNotificationModal from "@/components/common/AppNotificationModal";
import {
  fetchMyPropertyCountsThunk,
  triggerRefreshList
} from "@/store/propertySlice";

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

// Show browser notification
function showBrowserNotification(payload) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;

  const title = payload?.title || "Thông báo mới";
  const body = payload?.message || payload?.body || "Bạn có thông báo mới.";
  const link = payload?.link || payload?.url || "/dashboard/notifications";
  const icon = `${window.location.origin}/bell.png`;

  try {
    console.log("[Notify] showBrowserNotification CALLED with:", payload);
    window.__ALLOW_NOTIFICATION__ = true;
    const n = new window.Notification(title, { body, icon });
    window.__ALLOW_NOTIFICATION__ = false;
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
  const clientRef = useRef(null); // WebSocket client STOMP
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
  const [forceType, setForceType] = useState(null); // "reset" | "locked"
  const [forceMessage, setForceMessage] = useState("");

  // ======= state cho notification modal dùng chung =======
  const [notifModal, setNotifModal] = useState({
    open: false,
    status: "info", // "success" | "warning" | "error" | "info"
    title: "",
    message: "",
    description: "",
    primaryText: "OK",
    secondaryText: null,
    onPrimary: null,
    onSecondary: null,
  });

  const openNotifModal = useCallback((config) => {
    setNotifModal((prev) => ({
      ...prev,
      open: true,
      ...config,
    }));
  }, []);

  const closeNotifModal = useCallback(() => {
    setNotifModal((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  let WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    WS_URL = "ws://localhost:8080/ws";
  }

  if (location.hostname === "nexus5-land.vercel.app") {
    WS_URL = "wss://realestate-gmqu.onrender.com/ws";
  }

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

        // invalidate cache notification list/unread
        dispatch(
          notificationApi.util.invalidateTags([
            "UnreadCount",
            "Notifications",
          ])
        );

        const REAL_ESTATE_REFRESH_TYPES = [
          // Duyệt tin
          "LISTING_APPROVED",
          "LISTING_REJECTED",
          "LISTING_EDITED_PENDING",

          // Vòng đời & Hệ thống
          "LISTING_EXPIRED",
          "LISTING_EXPIRING_SOON",
          "LISTING_AUTO_RENEWED",
          "LISTING_RENEW_FAILED",
          "POST_WARNING",

          // Hành động (để đồng bộ nếu user mở nhiều tab)
          "LISTING_HIDDEN",
          "LISTING_UNHIDDEN",
          "LISTING_MARKED_SOLD",
          "LISTING_UNMARKED_SOLD"
        ];

        if (REAL_ESTATE_REFRESH_TYPES.includes(notif.type)) {
          console.log(`[WS] Tin BĐS thay đổi trạng thái (${notif.type}) -> Refreshing list...`);

          // 1. Cập nhật lại số đếm trên các Tab (Active: 5, Pending: 2...)
          dispatch(fetchMyPropertyCountsThunk());

          // 2. Bắn tín hiệu để PostManagerPage tự reload danh sách tin bên dưới
          dispatch(triggerRefreshList());
        }

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

        // 💰 3. Order refunded (dùng modal generic)
        if (notif.type === "ORDER_REFUNDED") {
          const orderId =
            notif.orderId ||
            notif.order?.id ||
            notif.data?.orderId ||
            notif.data?.order?.id ||
            null;
          const link =
            notif.link;
          openNotifModal({
            status: "success",
            title: "Hoàn tiền đơn hàng",
            message:
              notif.message ||
              (orderId
                ? `Đơn hàng #${orderId} của bạn đã được hoàn tiền.`
                : "Đơn hàng của bạn đã được hoàn tiền thành công."),
            primaryText: "Xem chi tiết",
            secondaryText: "Đóng",
            onPrimary: () => {
              navigate(link);
            },
            onSecondary: () => {
              // chỉ đóng modal
            },
          });

          showBrowserNotification(notif);
          return;
        }

        // 🔔 4. Các loại notification khác → browser notification như cũ
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
  }, [
    token,
    WS_URL,
    dispatch,
    currentUserId,
    handleLogout,
    openNotifModal,
    navigate,
  ]);

  // Subscribe to the currently open conversation
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    try {
      convoSubRef.current?.unsubscribe();
    } catch {
      //
    }
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
      } catch {
        //
      }
      convoSubRef.current = null;
    };
  }, [activeConversationId, dispatch]);

  return (
    <>
      {/* Modal buộc đăng xuất (reset/locked) */}
      <ForceLogoutModal
        open={forceOpen}
        type={forceType}
        message={forceMessage}
        onLogout={handleLogout}
        seconds={10}
      />

      {/* Modal thông báo dùng chung – spread props cho gọn */}
      <AppNotificationModal
        {...notifModal}
        onClose={closeNotifModal}
      />
    </>
  );
}
