import { Flex, Avatar, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { USER_MENU_ITEMS } from "@/data/UserMenuData";
import { useNavigate } from "react-router-dom";

export default function UserDropDownHeader({ user, onLoginClick, onRegisterClick, onLogout }) {
    const isLoggedIn = !!user;
    const nav = useNavigate();
    // helper: nếu có fn thì preventDefault; không có thì cứ đi link tĩnh
    const clickOrHref = (fn, href) =>
        fn
            ? { onClick: (e) => { e.preventDefault(); fn(); }, href: href || "#" }
            : { href };

    // ======= CHƯA LOGIN =======
    if (!isLoggedIn) {
        return (
            <Flex align="center" gap={12} className="px-2 py-1.5">
                <a {...clickOrHref(onLoginClick, "/dang-nhap")}
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

    // ======= ĐÃ LOGIN =======
    const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

    return (
        <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            getPopupContainer={(node) => node?.parentElement || document.body}
            dropdownRender={() => (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-[320px]">
                    <div className="bg-[#d6402c] text-white p-4">
                        <h3 className="font-bold text-[16px]">Gói Hội viên</h3>
                        <p className="text-[13px] leading-snug mt-1">
                            Tiết kiệm đến <strong>39%</strong> chi phí so với<br />đăng tin/đẩy tin lẻ
                        </p>
                        <button className="mt-3 w-full bg-white text-[#d6402c] font-semibold text-[14px] py-1.5 rounded-lg hover:opacity-90">
                            Tìm hiểu thêm
                        </button>
                    </div>

                    <div className="p-2">
                        {USER_MENU_ITEMS.map((item) => (
                            <a
                                key={item.text}
                                href={item.to || "#"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.to) nav(item.to);      // ✅ dùng react-router, không reload
                                }}
                                className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 text-[14px] font-medium no-underline !text-gray-800 hover:!text-[#d6402c]"
                            >
                                <div className="flex items-center gap-2">
                                    <span>{item.icon}</span>
                                    {item.text}
                                    {item.badge && (
                                        <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#fdece7] text-[#d6402c] border border-[#f7c7be]">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                {item.badge2 && (
                                    <span className="text-[11px] text-[#0ba989] font-semibold">{item.badge2}</span>
                                )}
                            </a>
                        ))}

                        <div className="h-px bg-gray-200 my-2" />

                        <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium no-underline !text-gray-800 hover:!text-[#d6402c]"
                        >
                            ↩️ Đăng xuất
                        </button>
                    </div>
                </div>
            )}
        >
            <Flex align="center" gap={8} className="cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                <Avatar size={45} src={user?.avatarUrl} className="bg-[#fdece7] text-[#d6402c] font-semibold">
                    {!user?.avatarUrl && initial}
                </Avatar>
                <span>
                    {user
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
                        : "Người dùng"}
                </span>
                <DownOutlined className="text-[10px]" />
            </Flex>
        </Dropdown>
    );
}
