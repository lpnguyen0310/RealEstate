// src/components/admidashboard/dashboard/AllNotificationsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* ---------- Tabs giống NotificationBell ---------- */
const TABS = {
    ALL: "Tất cả",
    FINANCE: "Tài chính",
    LISTING: "Tin đăng",
    SYSTEM: "Hệ thống",
};

const TAB_TYPES = {
    FINANCE: ["ORDER_PENDING", "PACKAGE_PURCHASED", "NEW_ORDER_PAID"],
    LISTING: [
        "LISTING_APPROVED",
        "LISTING_REJECTED",
        "NEW_LISTING_PENDING",
        "LISTING_PENDING_USER",
        "POST_WARNING",
        "REPORT_RECEIVED",
    ],
    SYSTEM: ["CATALOG_UPDATED", "NEW_USER_REGISTERED"],
};

/* ---------- Icon bubble ---------- */
/* --- Icons chuẩn theo hình ảnh đính kèm --- */
const IconBubble = ({ variant = "default" }) => {
    // Thêm hiệu ứng hover phóng to nhẹ
    const baseClass = "relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110";

    const variants = {
        // 1. Icon Cảnh báo (Màu đỏ nhạt)
        report: {
            bg: "bg-red-50 text-red-500 ring-1 ring-red-100", // Màu nền đỏ nhạt
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            )
        },
        // 2. Icon User mới (Màu xanh dương + dấu cộng)
        new_user: {
            bg: "bg-blue-50 text-blue-600 ring-1 ring-blue-100", // Màu nền xanh dương nhạt
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
            )
        },
        // 3. Icon Tài chính/Order (Màu xanh lá + chữ $) -> GIỐNG HÌNH BẠN GỬI
        finance: {
            bg: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100", // Màu nền xanh lá nhạt
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        // 4. Icon Tin nhắn/Chat (Màu xanh/tím nhạt)
        comment: {
            bg: "bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
            )
        },
        // Mặc định
        default: {
            bg: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
            )
        }
    };

    const style = variants[variant] || variants.default;

    return (
        <div className={`${baseClass} ${style.bg}`}>
            {style.icon}
        </div>
    );
};
export default function AllNotificationsModal({
    open,
    onClose,
    items,
    isLoading,
    isError,
    onItemClick,
}) {
    const [activeTab, setActiveTab] = useState("ALL");

    useEffect(() => {
        if (open) setActiveTab("ALL");
    }, [open]);

    // Tính số tin chưa đọc cho từng tab
    const unreadCounts = useMemo(() => {
        const res = {
            ALL: 0,
            FINANCE: 0,
            LISTING: 0,
            SYSTEM: 0,
        };

        // chỉ quan tâm các item chưa đọc
        const unread = (items || []).filter((x) => !x.read);

        res.ALL = unread.length;

        unread.forEach((it) => {
            const t = (it.rawType || "").toUpperCase();
            if (TAB_TYPES.FINANCE.includes(t)) res.FINANCE++;
            if (TAB_TYPES.LISTING.includes(t)) res.LISTING++;
            if (TAB_TYPES.SYSTEM.includes(t)) res.SYSTEM++;
        });

        return res;
    }, [items]);

    const filteredItems = useMemo(() => {
        if (activeTab === "ALL") return items;
        const typesForTab = TAB_TYPES[activeTab] || [];
        return items.filter((it) =>
            typesForTab.includes((it.rawType || "").toUpperCase())
        );
    }, [items, activeTab]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* panel với chiều cao cố định */}
            <div
                className="
                    relative bg-white rounded-2xl shadow-xl 
                    w-full max-w-xl 
                    h-[620px]
                    flex flex-col 
                    border border-gray-200 
                    mx-4
                "
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Tất cả thông báo
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Xem và lọc thông báo theo loại.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                        aria-label="Đóng"
                    >
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                d="M6 6l12 12M6 18L18 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Tabs + unread count từng tab */}
                <div className="px-5 pt-2 pb-3 border-b border-gray-100">
                    <div className="flex gap-2 text-sm overflow-x-auto scrollbar-none">
                        {Object.entries(TABS).map(([key, label]) => {
                            const isActive = key === activeTab;
                            const count = unreadCounts[key] || 0;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveTab(key)}
                                    className={[
                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap border text-xs font-medium transition",
                                        isActive
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                                    ].join(" ")}
                                >
                                    <span>{label}</span>
                                    {count > 0 && (
                                        <span
                                            className={
                                                "min-w-[1.4rem] h-5 px-1 inline-flex items-center justify-center rounded-full text-[11px] font-semibold " +
                                                (isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-blue-100 text-blue-700")
                                            }
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <ul className="divide-y divide-gray-100">
                        {isLoading && (
                            <li className="p-4 text-sm text-gray-500">
                                Đang tải thông báo...
                            </li>
                        )}

                        {isError && !isLoading && (
                            <li className="p-4 text-sm text-red-500">
                                Đã xảy ra lỗi khi tải thông báo.
                            </li>
                        )}

                        {!isLoading && !isError && filteredItems.length === 0 && (
                            <li className="p-6 text-sm text-gray-500 text-center">
                                Không có thông báo nào trong mục này.
                            </li>
                        )}

                        {!isLoading &&
                            !isError &&
                            filteredItems.map((item) => (
                                <li
                                    key={item.id}
                                    className={
                                        item.read
                                            ? "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                            : "flex items-start gap-3 px-4 py-3 bg-blue-50/70 hover:bg-blue-50 transition-colors"
                                    }
                                >
                                    <IconBubble variant={item.type} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2">
                                            {!item.read && (
                                                <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                                                    Mới
                                                </span>
                                            )}
                                            <Link
                                                to={item.link || "#"}
                                                onClick={(e) => onItemClick(e, item)}
                                                className="font-medium text-sm leading-snug text-gray-900 hover:underline"
                                                dangerouslySetInnerHTML={{ __html: item.text }}
                                            />
                                        </div>
                                        <div className="mt-1.5 text-xs text-gray-500">
                                            {item.time}
                                        </div>
                                    </div>
                                </li>
                            ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 h-9 rounded-xl text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
