import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip, Drawer } from "antd";
import { MENUS } from "@/data/SideBar/menuDataSideBar";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import logo from "@/assets/featuretool4.png";

export default function Sidebar({
    pinned,
    setPinned,
    hovered,
    setHovered,
    isMobile = false,
    mobileOpen = false,
    setMobileOpen = () => { },
}) {
    const collapsed = !pinned && !hovered;
    const navigate = useNavigate();

    const NavItems = (
        <nav className={`${isMobile ? "px-3 pt-2" : "px-4"}`}>
            {MENUS.map((m) => {
                const Item = (
                    <NavLink
                        key={m.to}
                        to={m.to}
                        end
                        onClick={() => { if (isMobile) setMobileOpen(false); }}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 mb-2 rounded-2xl px-3 py-2.5 text-[#4B4B5A] hover:bg-[#F4F6FA] transition ${isActive
                                ? "text-white bg-gradient-to-r from-[#274067] to-[#375A8B] shadow-[0_8px_20px_rgba(23,42,87,0.25)]"
                                : ""
                            }`
                        }
                    >
                        <span className="grid h-6 w-6 place-items-center text-[18px]">{m.icon}</span>

                        {(isMobile || !collapsed) && (
                            <span className="text-[15px] font-medium truncate">{m.text}</span>
                        )}

                        <span className="ml-auto text-[12px] opacity-60 group-hover:opacity-80">›</span>
                    </NavLink>
                );

                if (isMobile) return Item;
                return collapsed ? (
                    <Tooltip key={m.to} placement="right" title={m.text}>
                        {Item}
                    </Tooltip>
                ) : (
                    Item
                );
            })}
        </nav>
    );

    if (isMobile) {
        return (
            <Drawer
                placement="left"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                width={300}
                bodyStyle={{ padding: 0 }}
            >
                <div className="border-b border-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <img
                            src={logo}
                            alt="radanhadat.vn"
                            className="h-8"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                            onClick={() => {
                                setMobileOpen(false);
                                navigate("/");
                            }}
                        />
                    </div>
                </div>
                {NavItems}
            </Drawer>
        );
    }

    // —— Desktop aside
    return (
        <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`sticky top-0 h-svh relative shrink-0 border-r border-gray-100 bg-white transition-all duration-300 ease-out overflow-hidden ${collapsed ? "w-[84px]" : "w-[264px]"
                }`}
            style={{ minHeight: "100vh" }}
        >
            <div className={`border-b border-gray-50 ${collapsed ? "px-0 py-3" : "px-4 py-4"}`}>
                <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                    <img
                        src={logo}
                        alt="radanhadat.vn"
                        className={`${collapsed ? "h-7" : "h-8"} transition-all`}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        onClick={() => navigate("/")}
                    />
                    {!collapsed && (
                        <button
                            onClick={() => setPinned((v) => !v)}
                            className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 transition"
                            title={pinned ? "Bỏ ghim thanh bên" : "Ghim thanh bên"}
                        >
                            {pinned ? <PushpinFilled className="text-[#1D3B67]" /> : <PushpinOutlined className="text-gray-500" />}
                        </button>
                    )}
                </div>
            </div>

            {NavItems}
        </aside>
    );
}
