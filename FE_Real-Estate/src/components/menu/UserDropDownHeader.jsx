import { Flex, Avatar, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { USER_MENU_ITEMS } from "@/data/UserMenuData";

export default function UserDropdown() {
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
                                href="#"
                                className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 text-[14px] font-medium no-underline !text-gray-800 hover:!text-[#d6402c] visited:!text-gray-800 focus:!text-[#d6402c]"
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
                                    <span className="text-[11px] text-[#0ba989] font-semibold">
                                        {item.badge2}
                                    </span>
                                )}
                            </a>
                        ))}

                        <div className="h-px bg-gray-200 my-2" />
                        <a
                            href="#"
                            className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium no-underline !text-gray-800 hover:!text-[#d6402c] visited:!text-gray-800 focus:!text-[#d6402c]"
                        >
                            ↩️ Đăng xuất
                        </a>
                    </div>
                </div>
            )}
        >
            <Flex align="center" gap={8} className="cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                <Avatar size={45} className="bg-[#fdece7] text-[#d6402c] font-semibold">L</Avatar>
                <span className="font-medium text-gray-800">Nguyên Lê</span>
                <DownOutlined className="text-[10px]" />
            </Flex>
        </Dropdown>
    );
}
