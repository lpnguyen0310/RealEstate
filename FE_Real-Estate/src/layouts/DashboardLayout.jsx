// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { logoutThunk } from "@/store/authSlice";
import AIChatWidget from "../components/aiChatBox/AIChatWidget";
export default function DashboardLayout() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);

  const handleLogout = async () => {
    try { await dispatch(logoutThunk()).unwrap(); nav("/", { replace: true }); } catch { }
  };

  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-[#F7F8FC]">
      <Sidebar pinned={pinned} setPinned={setPinned} hovered={hovered} setHovered={setHovered} />

      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-30 bg-[#F7F8FC] px-6 pt-6">
          <DashboardHeader title="Tổng quan" user={user} notifyCount={31} onLogout={handleLogout} />
        </div>

        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <Outlet context={{ user }} />
          <AIChatWidget user={user} size="md" />

        </main>
      </div>
    </div>
  );
}
