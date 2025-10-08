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
    nav("/", { replace: true });
  };

  return (
    // khung cao = viewport + không cho trang ngoài scroll
    <div className="flex h-svh overflow-hidden bg-[#F7F8FC]">
      {/* Sidebar sticky (sẽ stick theo viewport) */}
      <Sidebar
        pinned={pinned}
        setPinned={setPinned}
        hovered={hovered}
        setHovered={setHovered}
      />

      {/* Cột phải: header sticky + content scroll */}
      <div className="flex-1 flex flex-col">
        {/* Header sticky ở đỉnh vùng scroll bên phải */}
        <div className="sticky top-0 z-30 bg-[#F7F8FC] px-6 pt-6">
          <DashboardHeader
            title="Tổng quan"
            user={user}
            notifyCount={31}
            onLogout={handleLogout}
          />
        </div>

        {/* Chỉ phần này được scroll dọc */}
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
