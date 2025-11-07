// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { logoutThunk, getProfileThunk } from "@/store/authSlice";
import ChatHub from "@/components/chathub/ChatHub";
import { MENUS } from "@/data/SideBar/menuDataSideBar";

function findMenuByPath(pathname) {
  const sorted = [...MENUS].sort((a, b) => (b.to?.length || 0) - (a.to?.length || 0));
  return sorted.find((m) => pathname === m.to || pathname.startsWith(m.to + "/"));
}

export default function DashboardLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);

  const refetchUser = useCallback(async () => {
    try {
      await dispatch(getProfileThunk()).unwrap();
    } catch { }
  }, [dispatch]);

  useEffect(() => {
    if (!user) refetchUser();
  }, [user, refetchUser]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      nav("/", { replace: true });
    } catch { }
  };

  // —— Detect mobile (<= 640px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // —— Header title + breadcrumb
  const { title, crumbs } = useMemo(() => {
    const path = location.pathname;
    const hit = findMenuByPath(path) || { text: "Tổng quan", to: "/dashboard" };
    const bc = [
      { label: "Trang chủ", to: "/" },
      { label: hit.text || "Tổng quan", to: hit.to || "/dashboard" },
    ];
    return { title: hit.text || "Tổng quan", crumbs: bc };
  }, [location.pathname]);

  // —— Sidebar state (desktop) & Drawer state (mobile)
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-[#F7F8FC]">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          pinned={pinned}
          setPinned={setPinned}
          hovered={hovered}
          setHovered={setHovered}
          isMobile={false}
        />
      )}

      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-30 bg-[#F7F8FC] px-6 pt-6 sm:px-6 sm:pt-6 px-3 pt-3">
          <DashboardHeader
            title={title}
            breadcrumbs={crumbs}
            live
            user={user}
            notifyCount={31}
            onLogout={handleLogout}
            isMobile={isMobile}
            onMenuClick={() => setMobileOpen(true)} // hamburger
          />
        </div>

        <main className="flex-1 overflow-y-auto sm:px-6 sm:pb-6 px-3 pb-3">
          <Outlet context={{ user, refetchUser }} />
          <ChatHub user={user} size={isMobile ? "sm" : "md"} />
        </main>
      </div>

      {/* Mobile drawer sidebar */}
      {isMobile && (
        <Sidebar
          isMobile
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          // các prop desktop vẫn truyền nhưng không dùng
          pinned={false}
          setPinned={() => { }}
          hovered={false}
          setHovered={() => { }}
        />
      )}
    </div>
  );
}
