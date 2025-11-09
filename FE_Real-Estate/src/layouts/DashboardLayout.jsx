// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import ChatHub from "@/components/chathub/ChatHub";

import { logoutThunk, getProfileThunk } from "@/store/authSlice";
import { MENUS } from "@/data/SideBar/menuDataSideBar";

/* ------------------ helpers ------------------ */
function findMenuByPath(pathname) {
  const sorted = [...MENUS].sort(
    (a, b) => (b.to?.length || 0) - (a.to?.length || 0)
  );
  return sorted.find((m) => pathname === m.to || pathname.startsWith(m.to + "/"));
}

export default function DashboardLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);

  /* ---------- fetch profile if missing ---------- */
  const refetchUser = useCallback(async () => {
    try {
      await dispatch(getProfileThunk()).unwrap();
    } catch {
      /* noop */
    }
  }, [dispatch]);

  useEffect(() => {
    if (!user) refetchUser();
  }, [user, refetchUser]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      nav("/", { replace: true });
    } catch {
      /* noop */
    }
  };

  /* ---------- responsive: detect mobile (<= 640) ---------- */
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 640px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  /* ---------- header title + breadcrumbs ---------- */
  const { title, crumbs } = useMemo(() => {
    const path = location.pathname;
    const hit = findMenuByPath(path) || { text: "Tổng quan", to: "/dashboard" };
    const bc = [
      { label: "Trang chủ", to: "/" },
      { label: hit.text || "Tổng quan", to: hit.to || "/dashboard" },
    ];
    return { title: hit.text || "Tổng quan", crumbs: bc };
  }, [location.pathname]);

  /* ---------- sidebar state ---------- */
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Bỏ overflow-hidden, chỉ ẩn tràn ngang; min-h-screen + h-dvh desktop
    <div className="flex min-h-screen lg:h-dvh bg-[#F7F8FC] overflow-x-hidden">
      {/* Sidebar desktop */}
      {!isMobile && (
        <Sidebar
          pinned={pinned}
          setPinned={setPinned}
          hovered={hovered}
          setHovered={setHovered}
          isMobile={false}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header sticky */}
        <div className="sticky top-0 z-30 bg-[#F7F8FC] px-3 pt-3 sm:px-6 sm:pt-6">
          <DashboardHeader
            title={title}
            breadcrumbs={crumbs}
            live
            user={user}
            notifyCount={31}
            onLogout={handleLogout}
            isMobile={isMobile}
            onMenuClick={() => setMobileOpen(true)}
          />
        </div>

        {/* Nội dung scrollable */}
        <main
          className="flex-1 min-h-0 overflow-y-auto px-3 pb-28 sm:px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Outlet context={{ user, refetchUser }} />
          {/* ⚠️ Không render ChatHub trong vùng scroll */}
        </main>
      </div>

      {/* Sidebar mobile (drawer) */}
      {isMobile && (
        <Sidebar
          isMobile
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          pinned={false}
          setPinned={() => { }}
          hovered={false}
          setHovered={() => { }}
        />
      )}

      {/* ChatHub cố định theo viewport */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          right: 24,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)`,
        }}
      >
        {/* Cho phép tương tác với widget */}
        <div className="pointer-events-auto">
          <ChatHub user={user} size={isMobile ? "sm" : "md"} />
        </div>
      </div>
    </div>
  );
}
