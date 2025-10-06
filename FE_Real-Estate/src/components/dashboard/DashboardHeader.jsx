import { BellOutlined, CreditCardOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button } from "antd";

export default function DashboardHeader({
  title = "Tổng quan",
  user = { fullName: "Nguyên Lê", initial: "N" },
  notifyCount = 31,
}) {
  return (
    <header className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-3 mb-6">
      {/* LEFT: Title */}
      <h1 className="text-[22px] font-semibold text-[#3D3D4E] !mb-[0px]">{title}</h1>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-6">
        {/* Mua Tin */}
        <Button
          icon={<CreditCardOutlined />}
          type="default"
          className="flex items-center font-semibold text-[#1D3B67] border-[#E6EBF1] hover:bg-[#F6F8FB]"
        >
          Mua Tin
        </Button>

        {/* Bell */}
        <Badge count={notifyCount} size="small" color="#e74c3c">
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined className="text-[18px] text-gray-600" />}
          />
        </Badge>

        {/* Greeting + Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right leading-tight">
            <span className="text-[13px] text-gray-500">Xin chào</span>
            <span className="text-[15px] font-semibold text-[#2C2C35]">
              {user.fullName}
            </span>
          </div>

          <Avatar
            size={42}
            style={{
              backgroundColor: "#C84E7D",
              fontWeight: 600,
              color: "white",
            }}
          >
            {user.initial || "U"}
          </Avatar>
        </div>
      </div>
    </header>
  );
}
