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

/* ---------- Skeleton ---------- */
const SkeletonItem = () => (
    <li className="flex items-start gap-3 py-3 px-2 -mx-2">
        <div className="shrink-0 w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="min-w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-2 animate-pulse" />
        </div>
    </li>
);

/* ---------- Relative time ---------- */
function formatRelativeTime(isoDate) {
    if (!isoDate) return "";
    try {
        const date = new Date(isoDate);
        const seconds = Math.floor((new Date() - date) / 1000);
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
        return "Vài giây trước";
    } catch {
        return "Không rõ";
    }
}

/* ---------- Map BE type -> FE icon variant ---------- */
function mapApiTypeToIconType(apiType) {
    const type = (apiType || "").toUpperCase();
    switch (type) {
        case "NEW_LISTING_PENDING":
        case "LISTING_PENDING_USER":
        case "POST_WARNING":
        case "REPORT_RECEIVED":
            return "report";

        case "NEW_USER_REGISTERED":
            return "new_user";

        case "ORDER_PENDING":
        case "PACKAGE_PURCHASED":
        case "NEW_ORDER_PAID":
            return "finance";

        case "LISTING_APPROVED":
        case "LISTING_REJECTED":
            return "comment";

        case "CATALOG_UPDATED":
        default:
            return "comment";
    }
}

/* ---------- Icons cho card nhỏ ---------- */
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

const Dot = () => <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />;

const NewPing = () => (
    <span className="absolute -left-1 top-2.5">
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
        </span>
    </span>
);

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
                    rawType, // dùng cho filter tabs trong modal
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

    const liClass = (it) => {
        if (!it.read) {
            return [
                "relative",
                "flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl transition-colors",
                "bg-blue-50/70 hover:bg-blue-50",
                "ring-1 ring-blue-100",
                "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-blue-400/70",
            ].join(" ");
        }
        return "flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/70 transition-colors";
    };

    // Optimistic update vào cache getNotifications
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

        if (item.read) return; // đã đọc thì để Link tự navigate

        e.preventDefault();

        // 1) Optimistic update
        markReadInCache(item.id);

        // 2) Gọi BE persist
        try {
            await markAsRead(item.id).unwrap();
        } catch {
            // refetch sau sẽ sync nếu lệch
        } finally {
            // 3) Điều hướng
            navigate(to);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Thông báo mới
                        </h3>
                        {unreadCount > 0 && (
                            <span
                                className="
                                    inline-flex items-center justify-center
                                    min-w-[1.75rem] h-6 px-2
                                    rounded-full text-xs font-semibold
                                    bg-blue-100 text-blue-700 ring-1 ring-blue-200
                                "
                                title={`${unreadCount} thông báo chưa đọc`}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    <button
                        className="text-sm px-3 h-8 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
                        type="button"
                        onClick={() => setShowAllModal(true)}
                    >
                        {unreadCount > 0
                            ? `Xem tất cả (${unreadCount})`
                            : "Xem tất cả"}
                    </button>
                </div>

                {/* List nhỏ (4 item mới nhất) */}
                <ul className="divide-y divide-gray-100">
                    {/* Loading */}
                    {isLoading && (
                        <>
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </>
                    )}

                    {/* Error */}
                    {isError && (
                        <li className="py-6 text-center text-sm text-red-500">
                            Đã xảy ra lỗi khi tải thông báo.
                        </li>
                    )}

                    {/* Empty */}
                    {!isLoading &&
                        !isError &&
                        displayItems.length === 0 && (
                            <li className="py-6 text-center text-sm text-gray-500">
                                Chưa có thông báo mới
                            </li>
                        )}

                    {/* Data */}
                    {!isLoading &&
                        !isError &&
                        displayItems.map((item) => (
                            <li key={item.id} className="relative">
                                <Link
                                    to={item.link || "#"}
                                    className={liClass(item)}
                                    onClick={(e) => handleItemClick(e, item)}
                                >
                                    {!item.read && <NewPing />}

                                    <IconBubble variant={item.type} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start gap-2">
                                            {!item.read && (
                                                <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                                                    Mới
                                                </span>
                                            )}
                                            <p
                                                className="font-medium text-sm leading-snug text-gray-900"
                                                dangerouslySetInnerHTML={{
                                                    __html: item.text,
                                                }}
                                            />
                                        </div>

                                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                                            {!item.read && <Dot />}
                                            <span>{item.time}</span>
                                        </div>
                                    </div>

                                    <svg
                                        className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition ml-2 mt-1 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            d="M9 18l6-6-6-6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </Link>
                            </li>
                        ))}
                </ul>
            </div>

            {/* Modal xem tất cả + tabs phân loại */}
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
