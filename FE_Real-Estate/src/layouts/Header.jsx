import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Flex,
  Dropdown,
  Button,
  message,
  Drawer,
  Collapse,
  Divider,
} from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import React from "react";

import { NAVS } from "@/data/header_submenu";
import logo from "@/assets/logo.jpg";
import logo2 from "@/assets/logo2.svg";
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

  // ===== Mobile state =====
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activePanelKeys, setActivePanelKeys] = React.useState([]);

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

  // ===== Mobile: panels for NAVS =====
  const mobilePanels = (NAVS || []).map((grp) => ({
    key: grp.key,
    label: (
      <div className="flex items-center justify-between">
        <span className="font-medium text-[15px] text-gray-900">{grp.label}</span>
      </div>
    ),
    children: (
      <div className="flex flex-col gap-1">
        {(grp.items || []).map((it) => (
          <button
            key={it.to + it.text}
            onClick={() => {
              setMobileOpen(false);
              nav(`/search?type=${grp.key}&category=${encodeURIComponent(it.to)}`);
            }}
            className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <span className="text-[14px] text-gray-800">{it.text}</span>
            <RightOutlined className="text-[10px] text-gray-400" />
          </button>
        ))}
        <Divider className="!my-2" />
        <button
          onClick={() => {
            setMobileOpen(false);
            nav(`/search?type=${grp.key}`);
          }}
          className="w-full text-left px-3 py-2 rounded-lg bg-[#fff1ef] text-[#d6402c] font-medium"
        >
          Xem tất cả {grp.label.toLowerCase()}
        </button>
      </div>
    ),
  }));

  return (
    <>
      {/* ===== Desktop header (giữ nguyên) ===== */}
      <header className="sticky top-0 z-50 mx-auto bg-white border-b border-gray-200 w-full px-4 py-2 hidden lg:block">
        <Flex align="center" justify="space-between" className="mx-auto w-full h-[72px] px-4">
          {/* --- LEFT: Logo + Nav --- */}
          <Flex align="center" gap={32}>
            <a href="/" className="flex items-center h-full cursor-pointer px-4 py-3">
              <img
                src={logo}
                alt="logo"
                className="w-[160px] h-[80px] object-contain"
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

      {/* ===== Mobile/Tablet header (≤ lg) ===== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 w-full px-3 py-2 lg:hidden">
        <div className="flex items-center justify-between h-[56px]">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Mở menu"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
            >
              <MenuOutlined className="text-[20px]" />
            </button>

            <a href="/" className="flex items-center h-full">
              <img
                src={logo2}
                alt="logo"
                className="w-[130px] h-[40px] object-contain"
              />
            </a>
          </div>

          {/* Right: actions rút gọn */}
          <div className="flex items-center gap-2">
            {/* Tuỳ trường hợp bạn muốn ẩn Favorite trong mobile, có thể để nguyên */}
            <div className="hidden sm:block">
              <FavoritePostList />
            </div>

            <NotificationBell />

            <UserDropDownHeader
              user={user}
              compact
              loadingUser={loadingAuth || authUiLoading}
              onLoginClick={() => dispatch(openLoginModal())}
              onRegisterClick={() => dispatch(openRegisterModal())}
              onLogout={handleLogout}
            />

            <Button
              size="small"
              className="!h-9 !px-3 !rounded-md border-gray-200 hover:!border-gray-300 hover:!bg-gray-50 font-medium text-[#d6402c] bg-[#fff1ef]"
              onClick={() => {
                if (user) nav("/dashboard/posts");
                else dispatch(openLoginModal());
              }}
              disabled={loadingAuth}
            >
              Đăng tin
            </Button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title={
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[16px]">Danh mục</span>
              <button
                aria-label="Đóng"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <CloseOutlined />
              </button>
            </div>
          }
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={Math.min(window.innerWidth * 0.86, 360)}
          bodyStyle={{ padding: 12 }}
        >
          {/* Quick entry */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              className="flex-1 !h-10 !rounded-lg"
              onClick={() => {
                setMobileOpen(false);
                nav("/search");
              }}
            >
              Tìm kiếm
            </Button>
            <Button
              type="primary"
              className="flex-1 !h-10 !rounded-lg !bg-[#d6402c]"
              onClick={() => {
                setMobileOpen(false);
                if (user) nav("/dashboard/posts");
                else dispatch(openLoginModal());
              }}
            >
              Đăng tin
            </Button>
          </div>

          <Divider className="!my-3" />

          {/* NAV groups */}
          <Collapse
            bordered={false}
            activeKey={activePanelKeys}
            onChange={(keys) => setActivePanelKeys(keys)}
            expandIconPosition="end"
            items={mobilePanels}
          />

          <Divider className="!my-3" />

          {/* Auth actions (khi chưa đăng nhập) */}
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="!h-10 !rounded-lg"
                onClick={() => {
                  setMobileOpen(false);
                  dispatch(openLoginModal());
                }}
              >
                Đăng nhập
              </Button>
              <Button
                className="!h-10 !rounded-lg"
                onClick={() => {
                  setMobileOpen(false);
                  dispatch(openRegisterModal());
                }}
              >
                Đăng ký
              </Button>
            </div>
          )}

          {/* User actions (đã đăng nhập) */}
          {user && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                className="!h-10 !rounded-lg"
                onClick={() => {
                  setMobileOpen(false);
                  nav("/dashboard");
                }}
              >
                Bảng điều khiển
              </Button>
              <Button
                danger
                className="!h-10 !rounded-lg"
                onClick={handleLogout}
                loading={loadingAuth}
              >
                Đăng xuất
              </Button>
            </div>
          )}
        </Drawer>
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
