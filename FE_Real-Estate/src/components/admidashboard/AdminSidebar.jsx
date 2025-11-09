import { NavLink } from "react-router-dom";
import { Tooltip } from "antd";
import { PushpinOutlined, PushpinFilled, CloseOutlined } from "@ant-design/icons";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux"; // <<< THÊM
import { ADMIN_MENUS } from "@/data/SideBar/menuDataAdmin";
import logo from "@/assets/featuretool4.png";

/**
 * Props:
 * - pinned, setPinned, hovered, setHovered   (desktop dock behavior)
 * - isMobile, mobileOpen, setMobileOpen      (mobile overlay behavior)
 */
export default function AdminSidebar({
    pinned,
    setPinned,
    hovered,
    setHovered,
    isMobile = false,
    mobileOpen = false,
    setMobileOpen = () => { },
}) {
    const collapsed = !isMobile && !pinned && !hovered;

    // === LẤY UNREAD TỪ REDUX ===
    const conversations = useSelector((s) => s.support?.conversations || []);
    const supportUnreadTotal = useMemo(() => {
        // ưu tiên unreadForAssignee, fallback unreadCount/unread
        return conversations.reduce((sum, c) => {
            const v =
                c.unreadForAssignee ??
                c.unreadCount ??
                c.unread ??
                0;
            return sum + (Number.isFinite(v) ? Number(v) : 0);
        }, 0);
    }, [conversations]);

    // ESC to close on mobile
    useEffect(() => {
        if (!isMobile) return;
        const onKey = (e) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isMobile, setMobileOpen]);

    // BACKDROP (mobile)
    const Backdrop = () =>
        isMobile ? (
            <div
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />
        ) : null;

    // --- Badge nhỏ cho chế độ collapsed (đè lên icon) ---
    const DotBadge = ({ count }) =>
        !count ? null : (
            <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                   bg-rose-600 text-white text-[10px] leading-[18px] text-center shadow"
                aria-label={`${count} tin chưa đọc`}
                title={`${count} tin chưa đọc`}
            >
                {count > 99 ? "99+" : count}
            </span>
        );

    // --- Badge dạng pill cho chế độ full width ---
    const PillBadge = ({ count }) =>
        !count ? null : (
            <span
                className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5
                   rounded-full bg-rose-600 text-white text-[11px] leading-none"
                aria-label={`${count} tin chưa đọc`}
                title={`${count} tin chưa đọc`}
            >
                {count > 99 ? "99+" : count}
            </span>
        );

    return (
        <>
            {/* Backdrop for mobile */}
            <Backdrop />

            {/* Sidebar panel */}
            <aside
                onMouseEnter={() => !isMobile && setHovered(true)}
                onMouseLeave={() => !isMobile && setHovered(false)}
                className={[
                    // Positioning
                    isMobile ? "fixed z-50 top-0 left-0 h-svh" : "sticky top-0 h-svh relative shrink-0",
                    // Sizing
                    isMobile ? "w-[280px]" : collapsed ? "w-[92px]" : "w-[280px]",
                    // Surface
                    "border-r border-gray-100 bg-white transition-all duration-300 ease-out overflow-hidden",
                    // Slide in/out for mobile
                    isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : "",
                    // Shadow on mobile
                    isMobile ? "shadow-2xl" : "",
                ].join(" ")}
                style={{ minHeight: "100vh" }}
                role="navigation"
                aria-label="Admin Sidebar"
            >
                {/* Header: logo + pin/close */}
                <div className={`border-b border-gray-50 ${collapsed ? "px-0 py-4" : "px-5 py-5"}`}>
                    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                        <img
                            src={logo}
                            alt="admin"
                            className={`${collapsed ? "h-8" : "h-9"} transition-all`}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />

                        {/* Right action: pin (desktop) or close (mobile) */}
                        {!collapsed &&
                            (isMobile ? (
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 transition"
                                    title="Đóng menu"
                                    aria-label="Đóng menu"
                                >
                                    <CloseOutlined className="text-gray-600 text-[18px]" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setPinned((v) => !v)}
                                    className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 transition"
                                    title={pinned ? "Bỏ ghim thanh bên" : "Ghim thanh bên"}
                                    aria-pressed={pinned}
                                >
                                    {pinned ? (
                                        <PushpinFilled className="text-[#1D3B67] text-[18px]" />
                                    ) : (
                                        <PushpinOutlined className="text-gray-500 text-[18px]" />
                                    )}
                                </button>
                            ))}
                    </div>
                </div>

                {/* Menu list */}
                <nav className="px-3 sm:px-4 pt-2 pb-4 overflow-y-auto">
                    {ADMIN_MENUS.map((m) => {
                        const isSupport = m.to === "/admin/support";
                        const ItemCore = ({ isActive }) => (
                            <div
                                className={[
                                    "group relative flex items-center gap-4 mb-2.5 rounded-3xl",
                                    "px-4",
                                    "py-3.5",
                                    "text-[#3f475a] hover:bg-[#F3F6FB] transition",
                                    isActive &&
                                    "text-white bg-gradient-to-r from-[#274067] to-[#375A8B] shadow-[0_10px_24px_rgba(23,42,87,0.22)]",
                                ].join(" ")}
                            >
                                {/* icon container + dot badge when collapsed */}
                                <span className="relative grid place-items-center h-8 w-8 text-[20px] leading-none shrink-0">
                                    {m.icon}
                                    {/* Collapsed hoặc mobile-collapsed: hiển thị dot trên icon */}
                                    {(!isMobile && collapsed && isSupport) && <DotBadge count={supportUnreadTotal} />}
                                </span>

                                {/* text */}
                                {(!collapsed || isMobile) && (
                                    <span className="text-[16px] font-medium truncate">{m.text}</span>
                                )}

                                {/* caret hoặc pill ở bên phải */}
                                {(!collapsed || isMobile) && (
                                    isSupport ? (
                                        // với mục Hỗ trợ: thay caret bằng pill unread (nếu có), nếu không có thì vẫn giữ caret
                                        supportUnreadTotal > 0 ? (
                                            <PillBadge count={supportUnreadTotal} />
                                        ) : (
                                            <span className="ml-auto text-[12px] opacity-60 group-hover:opacity-80">›</span>
                                        )
                                    ) : (
                                        <span className="ml-auto text-[12px] opacity-60 group-hover:opacity-80">›</span>
                                    )
                                )}
                            </div>
                        );

                        const Item = (
                            <NavLink
                                key={m.to}
                                to={m.to}
                                end={m.end}
                                className={() => ""} // lớp đã xử lý trong ItemCore
                                onClick={() => {
                                    if (isMobile) setMobileOpen(false);
                                }}
                            >
                                {({ isActive }) => <ItemCore isActive={isActive} />}
                            </NavLink>
                        );

                        // On desktop-collapsed, wrap with tooltip
                        return !isMobile && collapsed ? (
                            <Tooltip key={m.to} placement="right" title={m.text}>
                                {Item}
                            </Tooltip>
                        ) : (
                            <div key={m.to}>{Item}</div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
