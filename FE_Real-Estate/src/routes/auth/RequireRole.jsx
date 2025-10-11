import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth() {
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);
  const loc = useLocation();

  const hasToken = !!sessionStorage.getItem("access_token");
  if (status === "loading" && hasToken) {
    return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
