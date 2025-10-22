import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Flex, Badge, Dropdown, Button, message } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import React from "react";

import { NAVS } from "@/data/header_submenu";

import UserDropDownHeader from "@/components/menu/UserDropDownHeader";
import FavoritePostList from "@/components/menu/FavoritePostList";
import NotificationBell from "@/components/menu/NotificationBell";
import LoginModal from "@/pages/Login/LoginModal";
import RegisterModal from "@/pages/Signup/RegisterModal";

import { logoutThunk } from "@/store/authSlice";
import {
  openLoginModal,
  closeLoginModal,
  openRegisterModal,
  closeRegisterModal,
  switchToRegister,
  switchToLogin,
} from "@/store/uiSlice";

export default function Header() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  const { user, status } = useSelector((s) => s.auth);
  const loginOpen = useSelector((s) => s.ui.loginModalOpen);
  const registerOpen = useSelector((s) => s.ui.registerModalOpen);
  const loadingAuth = status === "loading";

  const [hoverKey, setHoverKey] = React.useState(null);
  const [authUiLoading, setAuthUiLoading] = React.useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      message.success("Đã đăng xuất.");
      nav("/", { replace: true });
    } catch {
      message.error("Đăng xuất thất bại.");
    }
  };

  const renderSubmenu = (items = [], parentKey) => (
    <div className="bds-submenu bg-white shadow-xl rounded-2xl p-2 w-[340px]">
      {items.map((it) => (
        <a
          key={it.to + it.text}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav(`/search?type=${parentKey}&category=${encodeURIComponent(it.to)}`);
          }}
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
          {/* --- LEFT: Logo + Nav --- */}
          <Flex align="center" gap={32}>
            <a href="/" className="flex items-center h-full cursor-pointer px-4 py-3">
              <img
                src="/src/assets/logo2.svg"
                alt="logo"
                className="w-[160px] h-[48px] object-contain"
              />
            </a>

            {/* NAV */}
            <div id="nav-anchor" className="hidden lg:flex relative">
              <div
                className="flex items-center h-full gap-8"
                onMouseLeave={() => setHoverKey(null)}
              >
                {NAVS.map((navItem) => {
                  const isActive = hoverKey === navItem.label;
                  return (
                    <Dropdown
                      key={navItem.key}
                      trigger={["hover"]}
                      placement="bottomLeft"
                      align={{ offset: [0, 10] }}
                      getPopupContainer={(node) => node?.parentElement || document.body}
                      dropdownRender={() =>
                        renderSubmenu(navItem.items || [], navItem.key)
                      }
                      arrow={{ pointAtCenter: false }}
                      onOpenChange={(open) =>
                        setHoverKey(open ? navItem.label : null)
                      }
                    >
                      <button
                        key={navItem.key}
                        onMouseEnter={() => setHoverKey(navItem.label)}
                        onFocus={() => setHoverKey(navItem.label)}
                        onClick={() => nav(`/search?type=${navItem.key}`)}
                        className={`relative text-[16px] font-medium text-gray-800 hover:text-gray-900 transition
                          after:absolute after:left-0 after:right-0 after:-bottom-[6px]
                          after:h-[2px] after:bg-[#d6402c] after:transition-transform after:origin-left
                          after:transform ${isActive ? "after:scale-x-100" : "after:scale-x-0"}`}
                      >
                        {navItem.label}
                      </button>
                    </Dropdown>
                  );
                })}
              </div>
            </div>
          </Flex>

          {/* --- RIGHT: Actions --- */}
          <Flex
            align="center"
            className="px-2 w-[520px] max-w-[460px] min-w-[420px]"
            gap={0}
            justify="space-evenly"
          >
            <FavoritePostList />

            {/* <Badge count={2} size="small" offset={[-2, 6]}>
              <BellOutlined className="text-[25px] text-gray-800 cursor-pointer hover:text-[#d6402c]" />
            </Badge> */}
            <NotificationBell />
            
            <UserDropDownHeader
              user={user}
              loadingUser={loadingAuth || authUiLoading}
              onLoginClick={() => dispatch(openLoginModal())}
              onRegisterClick={() => dispatch(openRegisterModal())}
              onLogout={handleLogout}
            />

            <Button
              className="!h-12 !px-6 !rounded-lg border-gray-200 hover:!border-gray-300 hover:!bg-gray-50 font-medium text-[#d6402c] bg-[#fff1ef]"
              onClick={() => {
                if (user) nav("/dashboard/posts");
                else dispatch(openLoginModal());
              }}
              disabled={loadingAuth}
            >
              <span className="text-[18px]">Đăng tin</span>
            </Button>
          </Flex>
        </Flex>
      </header>

      {/* --- Modals --- */}
      <LoginModal
        open={loginOpen}
        onClose={() => dispatch(closeLoginModal())}
        onRegisterClick={() => dispatch(switchToRegister())}
        onBeginLogging={() => setAuthUiLoading(true)}
        onSuccess={() => {
          setAuthUiLoading(false);
          dispatch(closeLoginModal());
        }}
      />

      <RegisterModal
        open={registerOpen}
        onClose={() => dispatch(closeRegisterModal())}
        onBackToLogin={() => dispatch(switchToLogin())}
      />
    </>
  );
}
