import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateFromSession, getProfileThunk } from "@/store/authSlice";
import { getAccessToken } from "@/utils/auth";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);

  useEffect(() => {
    dispatch(hydrateFromSession());
    const t = getAccessToken();
    if (t && !user && status !== "loading") {
      dispatch(getProfileThunk());
    }
  }, [dispatch]); 

  // (tuỳ chọn) nếu muốn có màn hình chờ ngắn
  // if (status === "loading" && getAccessToken() && !user) {
  //   return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
  // }

  return <AppRoutes />;
}
