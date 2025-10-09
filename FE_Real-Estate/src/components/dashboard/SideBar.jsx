import { NavLink } from "react-router-dom";
import { Tooltip } from "antd";
import { MENUS } from "@/data/SideBar/menuDataSideBar";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import logo from "@/assets/featuretool4.png";

export default function Sidebar({
    pinned,
    setPinned,
    hovered,
    setHovered,
}) {
    const collapsed = !pinned && !hovered; // logic thu gọn

    return (
        <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
                sticky top-0 h-svh   
        relative shrink-0 border-r border-gray-100 bg-white
        transition-all duration-300 ease-out overflow-hidden
        ${collapsed ? "w-[84px]" : "w-[264px]"}
      `}
            style={{ minHeight: "100vh" }}
        >
            {/* logo + nút ghim */}
            <div
                className={`border-b border-gray-50 ${collapsed ? "px-0 py-3" : "px-4 py-4"}`}
            >
                <div
                    className={`flex items-center ${collapsed ? "justify-center" : "justify-between"
                        }`}
                >
                    <img
                        src={logo}
                        alt="radanhadat.vn"
                        className={`${collapsed ? "h-7" : "h-8"} transition-all`}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    {/* NÚT GHIM: chỉ hiện khi không collapsed để khỏi chen vào layout */}
                    {!collapsed && (
                        <button
                            onClick={() => setPinned((v) => !v)}
                            className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 transition"
                            title={pinned ? "Bỏ ghim thanh bên" : "Ghim thanh bên"}
                        >
                            {pinned ? (
                                <PushpinFilled className="text-[#1D3B67]" />
                            ) : (
                                <PushpinOutlined className="text-gray-500" />
                            )}
                        </button>
                    )}
                </div>
            </div>


            {/* menu */}
            <nav className="px-4">
                {MENUS.map((m) => {
                    const Item = (
                        <NavLink
                            key={m.to}
                            to={m.to}
                            end
                            className={({ isActive }) =>
                                `group flex items-center gap-3 mb-2 rounded-2xl px-3 py-2.5 text-[#4B4B5A] hover:bg-[#F4F6FA] transition ${isActive
                                    ? "text-white bg-gradient-to-r from-[#274067] to-[#375A8B] shadow-[0_8px_20px_rgba(23,42,87,0.25)]"
                                    : ""
                                }`
                            }
                        >
                            <span className="grid h-6 w-6 place-items-center text-[18px]">{m.icon}</span>
                            {/* ẩn text khi thu gọn */}
                            {!collapsed && (
                                <span className="text-[15px] font-medium truncate">{m.text}</span>
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

            {/* footer Zalo + version */}
            <div className="absolute bottom-4 left-0 right-0">
                <div className="px-3">
                    <div
                        className={`
              flex items-center gap-3 rounded-2xl border border-gray-100 shadow-sm
              ${collapsed ? "justify-center p-2" : "px-3 py-2"}
            `}
                    >
                        <img src="/zalo.png" alt="Zalo" className="h-8 w-8 rounded-full" />
                        {!collapsed && <span className="text-sm text-gray-600">Chat với chúng tôi</span>}
                    </div>

                </div>
            </div>
        </aside>
    );
}
