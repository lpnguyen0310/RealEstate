// src/components/common/WebSocketListener.jsx
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "@/utils/auth";

export default function WebSocketListener() {
  const ref = useRef(null);
  const token = getAccessToken();
  const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  useEffect(() => {
    if (!token || ref.current) return;

    const client = new Client({
      webSocketFactory: () => new WebSocket(WS_URL), // 👈 WebSocket thuần
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (s) => console.log("[STOMP]", s),
    });

    client.onConnect = () => {
      console.log("[WS] connected (native WebSocket)");
      client.subscribe("/user/queue/notifications", (m) =>
        console.log("[WS] msg:", m.body)
      );
    };
    client.onStompError = (f) =>
      console.error("[WS] STOMP error:", f.headers?.message, f.body);
    client.onWebSocketClose = (e) =>
      console.warn("[WS] closed:", e?.code, e?.reason);
    client.onWebSocketError = (e) => console.error("[WS] error:", e);

    client.activate();
    ref.current = client;

    return () => {
      try { ref.current?.deactivate(); } finally { ref.current = null; }
    };
  }, [token, WS_URL]);

  return null;
}
