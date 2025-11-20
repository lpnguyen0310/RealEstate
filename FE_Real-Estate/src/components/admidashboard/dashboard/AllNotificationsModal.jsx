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
const IconBubble = ({ variant = "default" }) => {
    switch (variant) {
        case "report":
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
            );
        case "new_user":
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-1 ring-blue-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 21a8 8 0 0 0-16 0" />
                        <circle cx="10" cy="8" r="4" />
                    </svg>
                </div>
            );
        case "finance":
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M12 8c-1.657 0-3 .843-3 1.882C9 11.157 10.343 12 12 12s3 .843 3 1.882C15 15.157 13.657 16 12 16s-3-.843-3-1.882M12 6v2m0 8v2" />
                        <circle cx="12" cy="12" r="9" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center ring-1 ring-gray-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
            );
    }
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
