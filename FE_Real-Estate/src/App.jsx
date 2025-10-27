import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateFromSession, getProfileThunk } from "@/store/authSlice";
import { getAccessToken } from "@/utils/auth";
import AppRoutes from "@/routes/AppRoutes";
import WebSocketListener from "@/components/common/WebSocketListener";
import { hydrateFavorites } from "@/store/favoriteSlice";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);

  // 🔥 THÊM DÒNG NÀY
  const userId = user?.id ?? user?.userId ?? null;

  // 1️⃣ Hydrate session và load profile
  useEffect(() => {
    dispatch(hydrateFromSession());
    const t = getAccessToken();
    if (t && !user && status !== "loading") {
      dispatch(getProfileThunk());
    }
  }, [dispatch]); // giữ nguyên dependency array này

  // 2️⃣ Gọi hydrateFavorites mỗi khi userId thay đổi (đăng nhập / đăng xuất)
  useEffect(() => {
    dispatch(hydrateFavorites());
  }, [dispatch, userId]);

  // 3️⃣ Log để kiểm tra render
  console.log("App.jsx rendering - User:", user, "Status:", status);

  return (
    <>
      {/* Kiểm tra listener */}
      {user && console.log("App.jsx: Rendering WebSocketListener because user exists.")}
      {user && <WebSocketListener />}
      <AppRoutes />
    </>
  );
}
  