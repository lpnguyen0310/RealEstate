// App.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateFromSession, getProfileThunk } from "@/store/authSlice";
import { getAccessToken } from "@/utils/auth";
import AppRoutes from "@/routes/AppRoutes";
import WebSocketListener from "@/components/common/WebSocketListener"; // bạn nói đang dùng file này

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);

  useEffect(() => {
    // === Monkey-patch Notification (log & block) ===
    if (typeof window !== "undefined" && "Notification" in window) {
      const NativeNotification = window.Notification;
      window.__ALLOW_NOTIFICATION__ = false;

      function PatchedNotification(title, options) {
        const err = new Error();
        console.warn("[Patch] new Notification() called:", { title, options, stack: err.stack });
        if (window.__ALLOW_NOTIFICATION__) {
          return new NativeNotification(title, options);
        } else {
          console.warn("[Patch] Blocked stray Notification");
          return { close() { } };
        }
      }

      PatchedNotification.permission = NativeNotification.permission;
      PatchedNotification.requestPermission = NativeNotification.requestPermission.bind(NativeNotification);
      window.Notification = PatchedNotification;

      return () => {
        window.Notification = NativeNotification;
      };
    }
  }, []);

  useEffect(() => {
    dispatch(hydrateFromSession());
    const t = getAccessToken();
    if (t && !user && status !== "loading") {
      dispatch(getProfileThunk());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  console.log("App.jsx rendering - User:", user, "Status:", status);

  return (
    <>
      {user && <WebSocketListener />}
      <AppRoutes />
    </>
  );
}
