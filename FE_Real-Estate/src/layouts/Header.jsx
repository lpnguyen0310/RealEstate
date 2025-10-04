import { useEffect, useState } from "react";
import { Flex, Badge, Dropdown, Button, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { NAVS } from "@/data/header_submenu";
import UserDropDownHeader from "@/components/menu/UserDropDownHeader";
import LoginModal from "../pages/Login/LoginModal";
import RegisterModal from "../pages/Signup/RegisterModal";
import { SAVED_POSTS } from "@/data/SavedPost";
import FavoritePostList from "@/components/menu/FavoritePostList";

export default function Header() {
    const [hoverKey, setHoverKey] = useState(null);
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);

    // ===== User state (persist qua localStorage) =====
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user")) || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    const handleLogout = () => {
        setUser(null);
        // nếu có token thật thì xoá token/clear cookie ở đây
    };

    // ===== helper render submenu =====
    const renderSubmenu = (items = []) => (
        <div className="bds-submenu bg-white shadow-xl rounded-2xl p-2 w-[340px]">
            {items.map((it) => (
                <a
                    key={it.to + it.text}
                    href={it.to}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[14px] font-medium
                   hover:bg-gray-50 no-underline
                   !text-gray-800 hover:!text-[#d6402c] visited:!text-gray-800 focus:!text-[#d6402c]"
                >
                    <span>{it.text}</span>
                    {it.badge && (
                        <span className="ml-3 text-[12px] px-1.5 py-0.5 rounded bg-[#fdece7] text-[#d6402c] border border-[#f7c7be]">
                            {it.badge}
                        </span>
                    )}
                </a>
            ))}
        </div>
    );

    return (
        <>
            <header className="sticky top-0 z-50 mx-auto bg-white border-b border-gray-200 w-full px-4 py-2">
                <Flex align="center" justify="space-between" className="mx-auto w-full h-[72px] px-4">
                    <Flex align="center" gap={32}>
                        {/* Logo */}
                        <a href="/" className="flex items-center h-full cursor-pointer px-4 py-3">
                            <img src="/src/assets/logo2.svg" alt="logo" className="w-[160px] h-[48px] object-contain" />
                        </a>

                        {/* NAV */}
                        <div id="nav-anchor" className="hidden lg:flex relative">
                            <div className="flex items-center h-full gap-8" onMouseLeave={() => setHoverKey(null)}>
                                {NAVS.map((nav) => {
                                    const isActive = hoverKey === nav.label;
                                    const btn = (
                                        <button
                                            key={nav.key}
                                            onMouseEnter={() => setHoverKey(nav.label)}
                                            onFocus={() => setHoverKey(nav.label)}
                                            className={`relative text-[16px] font-medium text-gray-800 hover:text-gray-900 transition after:absolute after:left-0 after:right-0 after:-bottom-[6px] after:h-[2px] after:bg-[#d6402c] after:transition-transform after:origin-left after:transform ${isActive ? "after:scale-x-100" : "after:scale-x-0"
                                                }`}
                                        >
                                            {nav.label}
                                        </button>
                                    );

                                    return nav.items?.length ? (
                                        <Dropdown
                                            key={nav.key}
                                            trigger={["hover"]}
                                            placement="bottomLeft"
                                            align={{ offset: [0, 10] }}
                                            getPopupContainer={(node) => node?.parentElement || document.body}
                                            dropdownRender={() => renderSubmenu(nav.items)}
                                            arrow={{ pointAtCenter: false }}
                                            onOpenChange={(open) => setHoverKey(open ? nav.label : null)}
                                        >
                                            {btn}
                                        </Dropdown>
                                    ) : (
                                        <a
                                            key={nav.key}
                                            href={`/${nav.key}`}
                                            className="inline-block"
                                            onMouseEnter={() => setHoverKey(nav.label)}
                                        >
                                            {btn}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </Flex>

                    {/* RIGHT: Actions */}
                    <Flex
                        align="center"
                        className="px-2 w-[520px] max-w-[460px] min-w-[420px]"
                        gap={0}
                        justify="space-evenly"
                    >
                        {/* Favorite Post List */}
                        <FavoritePostList savedPosts={SAVED_POSTS} />
                        <Badge count={2} size="small" offset={[-2, 6]}>
                            <BellOutlined className="text-[25px] text-gray-800 cursor-pointer hover:text-[#d6402c]" />
                        </Badge>

                        <UserDropDownHeader
                            user={user}
                            onLoginClick={() => setLoginOpen(true)}
                            onRegisterClick={() => setRegisterOpen(true)}
                            onLogout={handleLogout}
                        />

                        <Button className="!h-12 !px-6 !rounded-lg border-gray-200 hover:!border-gray-300 hover:!bg-gray-50 font-medium text-[#d6402c] bg-[#fff1ef]">
                            <span className="text-[18px]">Đăng tin</span>
                        </Button>
                    </Flex>
                </Flex>
            </header>

            {/* ===== Modals ===== */}
            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onRegisterClick={() => {
                    setLoginOpen(false);
                    setRegisterOpen(true);
                }}
                onSuccess={(profile) => {
                    setUser(profile);
                    setLoginOpen(false);
                }}
            />

            <RegisterModal
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                onSuccess={(profile) => {
                    setUser(profile);
                    setRegisterOpen(false);
                }}
            />
        </>
    );
}
