import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";

export default function DashboardLayout() {
  // ghim và hover để điều khiển thu gọn
  const [pinned, setPinned] = useState(false);   // mặc định KHÔNG ghim → thu gọn
  const [hovered, setHovered] = useState(false);

  const user = { fullName: "Nguyễn Lê", initial: "N" };

  return (
    <div className="flex min-h-screen bg-[#F7F8FC]">
      <Sidebar
        pinned={pinned}
        setPinned={setPinned}
        hovered={hovered}
        setHovered={setHovered}
      />

      {/* CONTENT */}
      <div className="flex-1">
        {/* CONTAINER GIỮA TRANG */}
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6">
          <DashboardHeader title="Tổng quan" user={user} notifyCount={31} />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
