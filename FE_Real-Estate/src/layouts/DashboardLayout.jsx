// src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";

export default function DashboardLayout() {
  const nav = useNavigate();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  const user = { fullName: "Nguyễn Lê", email: "phuocnguyenlea04@gmail.com", initial: "N" };

  const handleLogout = () => {
    localStorage.removeItem("user");
    // nếu có token thật thì clear ở đây
    nav("/", { replace: true }); // ← quay về trang chủ
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8FC]">
      <Sidebar pinned={pinned} setPinned={setPinned} hovered={hovered} setHovered={setHovered} />

      <div className="flex-1 p-6">
        <DashboardHeader
          title="Tổng quan"
          user={user}
          notifyCount={31}
          onLogout={handleLogout} // ← truyền hàm thật
        />

        <Outlet /> {/* hiển thị nội dung trang con */}
      </div>
    </div>
  );
}
