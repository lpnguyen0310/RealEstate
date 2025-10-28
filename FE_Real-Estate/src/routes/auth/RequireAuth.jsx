import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAccessToken } from "@/utils/auth";

export default function RequireAuth() {
    const { user, status } = useSelector((s) => s.auth);
    const loc = useLocation();

    const hasToken = !!getAccessToken();
    const hasProfileCache = !!sessionStorage.getItem("profile");
    const isBootstrapping = status === "loading" || hasToken || hasProfileCache;

    if (!user && isBootstrapping) {
        return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
