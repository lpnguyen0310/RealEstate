import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireRole({ roles = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const has = Array.isArray(user.roles)
    ? user.roles.some(r => roles.includes(r))
    : roles.includes(user.role);

  return has ? <Outlet /> : <Navigate to="/403" replace />;
}
