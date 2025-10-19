import { NavLink } from "react-router-dom";
import { Tooltip } from "antd";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import { ADMIN_MENUS } from "@/data/SideBar/menuDataAdmin";
import logo from "@/assets/featuretool4.png";

export default function AdminSidebar({
    pinned,
    setPinned,
    hovered,
    setHovered,
}) {
    const collapsed = !pinned && !hovered;

    return (
        <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`sticky top-0 h-svh relative shrink-0 border-r border-gray-100 bg-white transition-all duration-300 ease-out overflow-hidden ${collapsed ? "w-[92px]" : "w-[280px]"
                }`}
            style={{ minHeight: "100vh" }}
        >
            {/* logo + nút ghim */}
            <div className={`border-b border-gray-50 ${collapsed ? "px-0 py-4" : "px-5 py-5"}`}>
                <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                    <img
                        src={logo}
                        alt="admin"
                        className={`${collapsed ? "h-8" : "h-9"} transition-all`}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    {!collapsed && (
                        <button
                            onClick={() => setPinned((v) => !v)}
                            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 transition"
                            title={pinned ? "Bỏ ghim thanh bên" : "Ghim thanh bên"}
                        >
                            {pinned ? (
                                <PushpinFilled className="text-[#1D3B67] text-[18px]" />
                            ) : (
                                <PushpinOutlined className="text-gray-500 text-[18px]" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* menu */}
            <nav className="px-4 pt-2">
                {ADMIN_MENUS.map((m) => {
                    const Item = (
                        <NavLink
                            key={m.to}
                            to={m.to}
                            end={m.end}
                            className={({ isActive }) =>
                                [
                                    "group flex items-center gap-4 mb-2.5 rounded-3xl",
                                    "px-4",                       // ngang lớn hơn
                                    "py-3.5",                     // dọc lớn hơn (≈56px tổng chiều cao)
                                    "text-[#3f475a] hover:bg-[#F3F6FB] transition",
                                    isActive &&
                                    "text-white bg-gradient-to-r from-[#274067] to-[#375A8B] shadow-[0_10px_24px_rgba(23,42,87,0.22)]",
                                ].join(" ")
                            }
                        >
                            {/* icon to hơn */}
                            <span
                                className={[
                                    "grid place-items-center",
                                    "h-8 w-8",               // icon container lớn hơn
                                    "text-[20px] leading-none",
                                ].join(" ")}
                            >
                                {m.icon}
                            </span>

                            {/* ẩn text khi thu gọn */}
                            {!collapsed && (
                                <span className="text-[16px] font-medium truncate">{m.text}</span>
                            )}

                            {/* caret ở mode full */}
                            {!collapsed && (
                                <span className="ml-auto text-[12px] opacity-60 group-hover:opacity-80">
                                    ›
                                </span>
                            )}
                        </NavLink>
                    );

                    return collapsed ? (
                        <Tooltip key={m.to} placement="right" title={m.text}>
                            {Item}
                        </Tooltip>
                    ) : (
                        Item
                    );
                })}
            </nav>
        </aside>
    );
}
