// src/routes/auth/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth() {
    const { user, status } = useSelector((s) => s.auth);
    const loc = useLocation();

    // Dấu hiệu còn đang bootstrap
    const hasToken = !!sessionStorage.getItem("access_token");
    const hasProfileCache = !!sessionStorage.getItem("profile");
    const isBootstrapping = status === "loading" || hasToken || hasProfileCache;

    // Nếu chưa có user nhưng đang bootstrap → chờ, đừng đá về /login
    if (!user && isBootstrapping) {
        return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
    }

    // Chỉ khi chắc chắn không có user và cũng không bootstrap nữa → redirect
    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
