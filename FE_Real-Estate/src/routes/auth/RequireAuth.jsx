import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth() {
    const { user, bootstrapping } = useAuth();
    const loc = useLocation();

    if (bootstrapping) {
        return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
