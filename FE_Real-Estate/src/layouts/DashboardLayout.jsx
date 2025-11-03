// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { logoutThunk, getProfileThunk } from "@/store/authSlice";
import ChatHub from "@/components/chathub/ChatHub";
import { MENUS } from "@/data/SideBar/menuDataSideBar"; // dùng để map tên theo route

// tiện ích: tìm item theo prefix path
function findMenuByPath(pathname) {
  // ưu tiên khớp dài nhất
  const sorted = [...MENUS].sort((a, b) => (b.to?.length || 0) - (a.to?.length || 0));
  return sorted.find(m => pathname === m.to || pathname.startsWith(m.to + "/"));
}

export default function DashboardLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);

  const refetchUser = useCallback(async () => {
    try { await dispatch(getProfileThunk()).unwrap(); } catch { }
  }, [dispatch]);

  useEffect(() => { if (!user) refetchUser(); }, [user, refetchUser]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      nav("/", { replace: true });
    } catch { }
  };

  // ===== Header title + breadcrumb tự động theo route =====
  const { title, crumbs } = useMemo(() => {
    const path = location.pathname;
    const hit = findMenuByPath(path) || { text: "Tổng quan", to: "/dashboard" };

    // breadcrumb: Trang chủ / <current>
    const bc = [
      { label: "Trang chủ", to: "/" },
      { label: hit.text || "Tổng quan", to: hit.to || "/dashboard" },
    ];

    return { title: hit.text || "Tổng quan", crumbs: bc };
  }, [location.pathname]);

  // sidebar state
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-[#F7F8FC]">
      <Sidebar pinned={pinned} setPinned={setPinned} hovered={hovered} setHovered={setHovered} />

      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-30 bg-[#F7F8FC] px-6 pt-6">
          <DashboardHeader
            title={title}
            breadcrumbs={crumbs}
            live // bật badge LIVE
            user={user}
            notifyCount={31}
            onLogout={handleLogout}
          />
        </div>

        <main className="flex-1 overflow-y-auto px-6 pb-6">
          {/* truyền setTitle nếu sau này page con muốn override tiêu đề */}
          <Outlet context={{ user, refetchUser }} />
          <ChatHub user={user} size="md" />
        </main>
      </div>
    </div>
  );
}
