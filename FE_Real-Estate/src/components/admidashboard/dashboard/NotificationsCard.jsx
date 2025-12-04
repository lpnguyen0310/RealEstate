// src/components/admidashboard/dashboard/NotificationsCard.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    notificationApi,
} from "@/services/notificationApi";

import AllNotificationsModal from "./AllNotificationsModal";

/* -------------------------------------------------------------------------- */
/* SUB COMPONENTS (UI)                                                        */
/* -------------------------------------------------------------------------- */

/* --- Skeleton Loading --- */
const SkeletonItem = () => (
    <li className="flex items-start gap-4 p-4 border-b border-gray-50 last:border-0">
        <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
        </div>
    </li>
);

/* --- Empty State --- */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">Không có thông báo mới</p>
    </div>
);

/* --- Icons (Updated: Finance $, User +, Report !) --- */
const IconBubble = ({ variant = "default" }) => {
    // Hiệu ứng hover: scale nhẹ
    const baseClass = "relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110";

    const variants = {
        // 1. Cảnh báo (Tam giác chấm than - Đỏ)
        report: {
            bg: "bg-red-50 text-red-500 ring-1 ring-red-100",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            )
        },
        // 2. User mới (Hình người dấu cộng - Xanh dương)
        new_user: {
            bg: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
            )
        },
        // 3. Tài chính/Đơn hàng (Đồng tiền $ - Xanh lá)
        finance: {
            bg: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        // 4. Tin nhắn/Khác (Hộp thoại - Tím/Xanh đậm)
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

/* -------------------------------------------------------------------------- */
/* LOGIC HELPERS                                                              */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(isoDate) {
    if (!isoDate) return "";
    try {
        const date = new Date(isoDate);
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "Vừa xong";
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    } catch {
        return "Không rõ";
    }
}

function mapApiTypeToIconType(apiType) {
    const type = (apiType || "").toUpperCase();
    switch (type) {
        // --- NHÓM CẢNH BÁO ---
        case "NEW_LISTING_PENDING":
        case "LISTING_PENDING_USER":
        case "POST_WARNING":
        case "REPORT_RECEIVED":
            return "report";

        // --- NHÓM USER MỚI ---
        case "NEW_USER_REGISTERED":
            return "new_user";

        // --- NHÓM TÀI CHÍNH/ĐƠN HÀNG ---
        case "ORDER_PENDING":
        case "PACKAGE_PURCHASED":
        case "NEW_ORDER_PAID":
            return "finance";

        // --- NHÓM DUYỆT BÀI/COMMENT ---
        case "LISTING_APPROVED":
        case "LISTING_REJECTED":
        case "CATALOG_UPDATED":
            return "comment";

        default:
            return "default";
    }
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function NotificationsCard() {
    const { data: apiData, isLoading, isError } = useGetNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showAllModal, setShowAllModal] = useState(false);

    // Chuẩn hóa dữ liệu, sort mới -> cũ
    const items = useMemo(() => {
        const arr = Array.isArray(apiData) ? apiData : [];
        return arr
            .map((n) => {
                const rawType = (n.type || n.notificationType || "").toUpperCase();
                return {
                    id: n.id,
                    rawType,
                    type: mapApiTypeToIconType(rawType),
                    text: n.message,
                    time: formatRelativeTime(n.createdAt),
                    link: n.link,
                    read: Boolean(n.read ?? n.isRead ?? false),
                    createdAt: n.createdAt,
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [apiData]);

    const unreadCount = useMemo(
        () => items.filter((it) => !it.read).length,
        [items]
    );

    const displayItems = items.slice(0, 4);

    // Optimistic update vào cache RTK Query
    const markReadInCache = (id) => {
        try {
            dispatch(
                notificationApi.util.updateQueryData(
                    "getNotifications",
                    undefined,
                    (draft) => {
                        const idx = Array.isArray(draft)
                            ? draft.findIndex((x) => x?.id === id)
                            : -1;
                        if (idx > -1) draft[idx].read = true;
                    }
                )
            );
        } catch {
            // ignore
        }
    };

    const handleItemClick = async (e, item) => {
        const to = item.link || "#";
        if (item.read) return; // Đã đọc thì để Link tự navigate

        e.preventDefault();

        // 1) Optimistic update
        markReadInCache(item.id);

        // 2) Gọi BE persist
        try {
            await markAsRead(item.id).unwrap();
        } catch {
            // ignore
        } finally {
            // 3) Điều hướng
            navigate(to);
        }
    };

    return (
        <>
            {/* Card Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden font-sans">

                {/* --- HEADER --- */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 sticky top-0 z-10">

                    {/* Title + Badge */}
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-800">
                            Thông báo
                        </h3>
                        {unreadCount > 0 && (
                            <span className="
                                flex items-center justify-center 
                                h-6 min-w-[1.5rem] px-1.5 
                                rounded-full text-xs font-bold 
                                bg-red-100 text-red-600 
                                ring-1 ring-red-200 shadow-sm
                            ">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {/* View All Button */}
                    <button
                        type="button"
                        onClick={() => setShowAllModal(true)}
                        className="
                            text-sm font-semibold text-blue-600 
                            hover:text-blue-700 hover:bg-white 
                            px-3 py-1.5 rounded-lg 
                            transition-all duration-200 
                            active:scale-95 shadow-sm border border-transparent hover:border-blue-100
                        "
                    >
                        Xem tất cả
                    </button>
                </div>

                {/* --- BODY LIST --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">

                    {/* Loading */}
                    {isLoading && (
                        <ul className="divide-y divide-gray-50">
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </ul>
                    )}

                    {/* Error */}
                    {isError && (
                        <div className="py-8 text-center text-sm text-red-500 bg-red-50/50 m-4 rounded-xl border border-red-100">
                            Đã xảy ra lỗi khi tải thông báo.
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && displayItems.length === 0 && (
                        <EmptyState />
                    )}

                    {/* Data Items */}
                    {!isLoading && !isError && displayItems.length > 0 && (
                        <ul className="flex flex-col">
                            {displayItems.map((item) => (
                                <li key={item.id} className="border-b border-gray-50 last:border-0">
                                    <Link
                                        to={item.link || "#"}
                                        onClick={(e) => handleItemClick(e, item)}
                                        className={`
                                            group relative flex items-start gap-4 p-4 transition-all duration-200
                                            ${!item.read
                                                ? "bg-blue-50/40 hover:bg-blue-50" // Chưa đọc: Nền xanh rất nhạt
                                                : "hover:bg-gray-50 bg-white"      // Đã đọc: Nền trắng
                                            }
                                        `}
                                    >
                                        {/* Thanh dọc đánh dấu chưa đọc (Left Indicator) */}
                                        {!item.read && (
                                            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />
                                        )}

                                        {/* Icon */}
                                        <div className="mt-1">
                                            <IconBubble variant={item.type} />
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col gap-1">
                                                <p
                                                    className={`text-[14px] leading-snug ${!item.read ? "font-semibold text-gray-900" : "text-gray-600"}`}
                                                    dangerouslySetInnerHTML={{ __html: item.text }}
                                                />
                                                <span className={`text-xs ${!item.read ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                                                    {item.time}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal xem tất cả */}
            <AllNotificationsModal
                open={showAllModal}
                onClose={() => setShowAllModal(false)}
                items={items}
                isLoading={isLoading}
                isError={isError}
                onItemClick={handleItemClick}
            />
        </>
    );
}