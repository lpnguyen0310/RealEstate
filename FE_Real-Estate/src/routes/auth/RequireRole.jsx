import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { getProfileThunk, hydrateFromSession } from "@/store/authSlice";

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

  const hasToken = !!sessionStorage.getItem("access_token");
  const cachedProfile = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("profile") || "null"); } catch { return null; }
  }, []);

  // Hydrate từ session ngay khi mount (nếu chưa có user)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      dispatch(hydrateFromSession());
    }
  }, [dispatch]);

  // Nếu có token mà chưa có user, chủ động fetch profile 1 lần
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (hasToken && !user && status === "idle" && !fetchedRef.current) {
      fetchedRef.current = true;
      dispatch(getProfileThunk());
    }
  }, [dispatch, hasToken, user, status]);

  // Tính role thực có (ưu tiên Redux, fallback cache)
  const effectiveRoles = (stateRoles?.length ? stateRoles : normalizeRoles(
    (cachedProfile?.roles ?? cachedProfile?.authorities ?? cachedProfile?.role ?? [])
  ));

  // Đang bootstrap -> hiển thị loading, tránh nhảy login sớm
  const isBootstrapping =
    status === "loading" ||
    (hasToken && (!user || effectiveRoles.length === 0));

  if (isBootstrapping) {
    return <div style={{ padding: 24 }}>Đang tải phiên đăng nhập…</div>;
  }

  const hasRequired = required.length === 0
    ? Boolean(user) // nếu không truyền roles, chỉ cần đã đăng nhập
    : required.some((r) => effectiveRoles.includes(r));

  return user && hasRequired
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
