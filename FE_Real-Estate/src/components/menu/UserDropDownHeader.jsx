import React from "react";
import { Flex, Avatar, Dropdown, Skeleton, Drawer, Divider } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { USER_MENU_ITEMS } from "@/data/UserMenuData";
import { useNavigate } from "react-router-dom";

export default function UserDropDownHeader({
    user,
    onLoginClick,
    onRegisterClick,
    onLogout,
    loadingUser = false,
}) {
    const nav = useNavigate();
    const isLoggedIn = !!user;

    // ---- detect mobile (≤640px)
    const [isMobile, setIsMobile] = React.useState(
        typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false
    );
    React.useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener?.("change", handler);
        return () => mq.removeEventListener?.("change", handler);
    }, []);

    // ---- bottom sheet (mobile)
    const [sheetOpen, setSheetOpen] = React.useState(false);

    const clickOrHref = (fn, href) =>
        fn
            ? {
                onClick: (e) => {
                    e.preventDefault();
                    fn();
                },
                href: href || "#",
            }
            : { href };

    if (!isLoggedIn) {
        // Guest: Đăng nhập / Đăng ký
        return (
            <Flex align="center" gap={12} className="px-2 py-1.5">
                <a
                    {...clickOrHref(onLoginClick, "/dang-nhap")}
                    className="text-[16px] font-medium !text-gray-800 hover:!text-[#d6402c] transition-colors duration-150"
                >
                    Đăng nhập
                </a>
                <span className="h-5 w-px bg-gray-300" aria-hidden="true" />
                <a
                    {...clickOrHref(onRegisterClick, "/dang-ky")}
                    className="text-[16px] font-medium !text-gray-800 hover:!text-[#d6402c] transition-colors duration-150"
                >
                    Đăng ký
                </a>
            </Flex>
        );
    }

    const initial =
        user?.fullName?.charAt(0)?.toUpperCase() ||
        user?.firstName?.charAt(0)?.toUpperCase() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        "U";

    // ===== Check quyền admin =====
    const isAdmin = user?.roles?.includes?.("ADMIN");

    // ===== Reusable menu content =====
    const MenuList = ({ dense = false, showHeader = true }) => (
        <div className={`${dense ? "p-2" : "p-3"}`}>
            {/* Header chỉ hiện desktop; mobile ẩn cho gọn */}
            {showHeader && (
                <div className="bg-[#d6402c] text-white p-4 rounded-xl">
                    <h3 className="font-bold text-[16px]">Gói Hội viên</h3>
                    <p className="text-[13px] leading-snug mt-1">
                        Tiết kiệm đến <strong>39%</strong> chi phí so với
                        <br />
                        đăng tin/đẩy tin lẻ
                    </p>
                    <button className="mt-3 w-full bg-white text-[#d6402c] font-semibold text-[14px] py-1.5 rounded-lg hover:opacity-90">
                        Tìm hiểu thêm
                    </button>
                </div>
            )}

            {showHeader && <Divider className="!my-2" />}

            <div className="flex flex-col">
                {USER_MENU_ITEMS.map((item) => (
                    <a
                        key={item.text}
                        href={item.to || "#"}
                        onClick={(e) => {
                            e.preventDefault();
                            if (item.to) nav(item.to);
                            if (isMobile) setSheetOpen(false);
                        }}
                        className={`flex items-center justify-between rounded-lg no-underline
              ${isMobile ? "px-3 py-3" : "px-4 py-2.5"}
              hover:bg-gray-50 text-[14px] font-medium !text-gray-800 hover:!text-[#d6402c]`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[18px]">{item.icon}</span>
                            <span>{item.text}</span>
                            {item.badge && (
                                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#fdece7] text-[#d6402c] border border-[#f7c7be]">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        {item.badge2 && (
                            <span className="text-[11px] text-[#0ba989] font-semibold">
                                {item.badge2}
                            </span>
                        )}
                    </a>
                ))}
            </div>

            <Divider className="!my-2" />

            {/* ===== NÚT ADMIN: chỉ admin mới thấy ===== */}
            {isAdmin && (
                <button
                    onClick={() => {
                        if (isMobile) setSheetOpen(false);
                        nav("/admin"); // đường dẫn trang quản lý admin
                    }}
                    className={`w-full text-left flex items-center gap-2 rounded-lg
            ${isMobile ? "px-3 py-3" : "px-4 py-2.5"}
            text-[14px] font-medium !text-[#d6402c] hover:!text-[#b83224] hover:bg-[#fff4f2]`}
                >
                    🛠️ Đi tới trang quản lý
                </button>
            )}

            {/* ===== Đăng xuất ===== */}
            <button
                onClick={() => {
                    if (isMobile) setSheetOpen(false);
                    onLogout?.();
                }}
                className={`w-full text-left flex items-center gap-2 rounded-lg
          ${isMobile ? "px-3 py-3" : "px-4 py-2.5"}
          text-[14px] font-medium !text-gray-800 hover:!text-[#d6402c] hover:bg-gray-50`}
            >
                ↩️ Đăng xuất
            </button>
        </div>
    );

    // ===== Mobile: bottom-sheet Drawer =====
    if (isMobile) {
        return (
            <>
                <button
                    className="cursor-pointer px-1.5 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => setSheetOpen(true)}
                >
                    {loadingUser ? (
                        <>
                            <Skeleton.Avatar active size={40} shape="circle" />
                        </>
                    ) : (
                        <>
                            <Avatar
                                size={40}
                                src={user?.avatarUrl}
                                className="bg-[#fdece7] text-[#d6402c] font-semibold"
                            >
                                {!user?.avatarUrl && initial}
                            </Avatar>
                        </>
                    )}
                </button>

                <Drawer
                    placement="bottom"
                    open={sheetOpen}
                    onClose={() => setSheetOpen(false)}
                    height={"auto"}
                    className="rounded-t-2xl"
                    styles={{
                        body: { padding: 0 },
                        header: { display: "none" },
                    }}
                >
                    <div className="w-full max-w-[640px] mx-auto p-3">
                        {/* Top bar nhỏ: avatar + tên */}
                        <div className="flex items-center gap-3 pb-2 px-1">
                            <Avatar
                                size={44}
                                src={user?.avatarUrl}
                                className="bg-[#fdece7] text-[#d6402c] font-semibold"
                            >
                                {!user?.avatarUrl && initial}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-[15px] font-semibold text-gray-900 truncate">
                                    {user?.fullName || user?.email}
                                </div>
                            </div>
                        </div>

                        {/* Nội dung cuộn */}
                        <div className="max-h-[65vh] overflow-y-auto">
                            <MenuList dense showHeader={false} />
                        </div>
                    </div>
                </Drawer>
            </>
        );
    }

    // ===== Desktop: Dropdown =====
    return (
        <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            getPopupContainer={(node) => node?.parentElement || document.body}
            dropdownRender={() => (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-[92vw] max-w-[340px] sm:w-[320px]">
                    <MenuList />
                </div>
            )}
        >
            <Flex
                align="center"
                gap={8}
                className="cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50"
            >
                {loadingUser ? (
                    <>
                        <Skeleton.Avatar active size={45} shape="circle" />
                        <span className="hidden sm:inline-block">
                            <Skeleton.Input active style={{ width: 140, height: 18 }} />
                        </span>
                        <DownOutlined className="hidden sm:inline text-[10px]" />
                    </>
                ) : (
                    <>
                        <Avatar
                            size={45}
                            src={user?.avatarUrl}
                            className="bg-[#fdece7] text-[#d6402c] font-semibold"
                        >
                            {!user?.avatarUrl && initial}
                        </Avatar>
                        <span className="hidden sm:inline">
                            {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email}
                        </span>
                        <DownOutlined className="hidden sm:inline text-[10px]" />
                    </>
                )}
            </Flex>
        </Dropdown>
    );
}
