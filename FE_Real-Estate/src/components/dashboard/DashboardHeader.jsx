// src/components/Dashboard/DashboardHeader.jsx
import { useMemo, useState } from "react";
import { BellOutlined, CreditCardOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Dropdown } from "antd";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardHeader({
  title = "Tổng quan",
  user,                // có thể null; sẽ chuẩn hoá bên dưới
  notifyCount = 31,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  // Chuẩn hoá user để hiển thị an toàn
  const displayUser = useMemo(() => {
    if (!user) {
      return { fullName: "Người dùng", email: "", initial: "U", avatarUrl: "" };
    }
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
          to="/profile"
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 no-underline text-gray-800"
        >
          <UserOutlined className="text-[16px] text-gray-600" />
          <span className="text-[14px] font-medium">Hồ sơ</span>
        </Link>

        <div className="h-px bg-gray-100 my-1" />

        <button
          onClick={() => {
            if (onLogout) onLogout();
            else {
              // Fallback
              localStorage.removeItem("user");
              nav("/", { replace: true });
            }
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
    <header className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-3 mb-6">
      <div className="flex items-center h-[42px]">
        <h1 className="text-[22px] font-semibold text-[#3D3D4E] leading-none !mb-[0px]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <Button
          icon={<CreditCardOutlined />}
          type="default"
          onClick={() => nav("/dashboard/purchase")}
          className="flex items-center font-semibold text-[#1D3B67] border-[#E6EBF1] hover:bg-[#F6F8FB]"
        >
          Mua Tin
        </Button>

        <Badge count={notifyCount} size="small" color="#e74c3c">
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined className="text-[18px] text-gray-600" />}
          />
        </Badge>

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
              size={42}
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
