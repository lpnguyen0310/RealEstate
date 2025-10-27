// src/routes/auth/RequireRole.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { getProfileThunk, hydrateFromSession } from "@/store/authSlice";
import { getAccessToken } from "@/utils/auth";

const normalizeRoles = (arr = []) =>
  arr
    .map((r) => (typeof r === "string" ? r : (r?.authority ?? r?.name ?? "")))
    .map((n) => String(n || "").toUpperCase())
    .map((n) => (n.startsWith("ROLE_") ? n.slice(5) : n))
    .filter(Boolean);

export default function RequireRole({ roles = [] }) {
  const dispatch = useDispatch();
  const { user, roles: stateRoles, status } = useSelector((s) => s.auth);
  const loc = useLocation();

  const required = useMemo(() => normalizeRoles(roles), [roles]);

  // ✅ Dùng chung 1 nguồn sự thật cho token
  const hasToken = !!getAccessToken();

  // đọc cache profile từ session hoặc local
  const cachedProfile = useMemo(() => {
    const read = (k) => {
      try { return JSON.parse(k || "null"); } catch { return null; }
    };
    const s = read(sessionStorage.getItem("profile"));
    const l = read(localStorage.getItem("profile"));
    return s || l || null;
  }, []);

  // Hydrate ngay khi mount (một lần)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      dispatch(hydrateFromSession());
    }
  }, [dispatch]);

  // Nếu có token mà chưa có user -> fetch profile đúng 1 lần
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (hasToken && !user && status === "idle" && !fetchedRef.current) {
      fetchedRef.current = true;
      dispatch(getProfileThunk());
    }
  }, [dispatch, hasToken, user, status]);

  // Tính vai trò hiện có (ưu tiên Redux, fallback cache)
  const effectiveRoles = (stateRoles?.length
    ? stateRoles
    : normalizeRoles(cachedProfile?.roles ?? cachedProfile?.authorities ?? cachedProfile?.role ?? [])
  );

  // Đang bootstrap → chờ, tránh redirect sớm
  const isBootstrapping =
    status === "loading" ||
    (hasToken && (!user || effectiveRoles.length === 0));

  if (isBootstrapping) {
    return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
  }

  const hasRequired = required.length === 0
    ? Boolean(user)
    : required.some((r) => effectiveRoles.includes(r));

  return (user && hasRequired)
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
