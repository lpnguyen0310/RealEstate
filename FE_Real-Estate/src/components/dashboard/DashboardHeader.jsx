// src/components/Dashboard/DashboardHeader.jsx
import { useMemo, useState } from "react";
import {
  CreditCardOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown } from "antd";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/menu/NotificationBell";

export default function DashboardHeader({
  title = "Tổng quan",
  breadcrumbs = [],
  live = false,
  user,
  notifyCount = 31,
  onLogout,
  isMobile = false,
  onMenuClick, // mở mobile drawer
}) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const displayUser = useMemo(() => {
    if (!user) return { fullName: "Người dùng", email: "", initial: "U", avatarUrl: "" };
    const fullName =
      user.fullName ||
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.email ||
      "Người dùng";
    const email = user.email || "";
    const initial = (user.initial || fullName?.[0] || email?.[0] || "U").toUpperCase();
    return { fullName, email, initial, avatarUrl: user.avatarUrl || "" };
  }, [user]);

  const dropdown = (
    <div className="bg-white w-[320px] rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="py-1">
        <Link
          to="/dashboard/purchase"
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 no-underline text-gray-800"
        >
          <CreditCardOutlined className="text-[16px] text-gray-600" />
          <span className="text-[14px] font-medium">Mua tin</span>
        </Link>

        <Link
          to="/dashboard/account"
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 no-underline text-gray-800"
        >
          <UserOutlined className="text-[16px] text-gray-600" />
          <span className="text-[14px] font-medium">Hồ sơ</span>
        </Link>

        <div className="h-px bg-gray-100 my-1" />

        <button
          onClick={() => {
            onLogout?.();
            setOpen(false);
          }}
          className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-800"
        >
          <LogoutOutlined className="text-[16px] text-gray-600" />
          <span className="text-[14px] font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm sm:px-6 sm:py-3 sm:mb-6 px-3 py-2 mb-3">
      <div className="flex items-start gap-3">
        {/* Hamburger (mobile) */}
        {isMobile && (
          <button
            aria-label="Mở menu"
            onClick={onMenuClick}
            className="grid place-items-center h-9 w-9 rounded-lg border border-gray-200 bg-white shadow-sm mr-1"
          >
            <MenuOutlined />
          </button>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 h-[36px] sm:gap-3 sm:h-[42px]">
            <h1 className="text-[18px] sm:text-[22px] font-semibold text-[#3D3D4E] leading-none !mb-0">
              {title}
            </h1>
            {live && (
              <span className="inline-flex items-center text-[11px] sm:text-[12px] font-semibold px-2 py-0.5 rounded-md bg-[#ECF2FF] text-[#274067] border border-[#D9E3FF]">
                LIVE
              </span>
            )}
          </div>

          {/* Breadcrumb: ẩn bớt trên mobile */}
          {!isMobile && breadcrumbs?.length > 0 && (
            <nav className="text-[13px] text-[#7A8395]">
              {breadcrumbs.map((c, i) => (
                <span key={i}>
                  {c.to ? (
                    <Link to={c.to} className="hover:text-[#1D3B67]">
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && (
                    <span className="mx-2 text-[#C0C6D4]">/</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Nút “Mua Tin”: rút gọn mobile */}
        <Button
          icon={<CreditCardOutlined />}
          type="default"
          onClick={() => nav("/dashboard/purchase")}
          className="font-semibold text-[#1D3B67] border-[#E6EBF1] hover:bg-[#F6F8FB]"
        >
          <span className="hidden sm:inline">Mua Tin</span>
        </Button>

        <NotificationBell count={notifyCount} />

        <Dropdown
          open={open}
          onOpenChange={setOpen}
          trigger={["click"]}
          placement="bottomRight"
          dropdownRender={() => dropdown}
          getPopupContainer={(node) => node?.parentElement || document.body}
        >
          <button className="outline-none">
            <Avatar
              size={isMobile ? 36 : 42}
              src={displayUser.avatarUrl}
              style={{ backgroundColor: "#C84E7D", fontWeight: 600, color: "white" }}
            >
              {!displayUser.avatarUrl && displayUser.initial}
            </Avatar>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
