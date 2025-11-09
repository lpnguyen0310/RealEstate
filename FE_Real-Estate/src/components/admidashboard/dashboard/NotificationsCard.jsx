// src/components/admidashboard/dashboard/NotificationsCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetNotificationsQuery } from "@/services/notificationApi";

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

/* ---------- Map BE type -> FE type ---------- */
function mapApiTypeToIconType(apiType) {
    const type = (apiType || "").toUpperCase();
    switch (type) {
        case "NEW_LISTING_PENDING":
        case "REPORT_RECEIVED":
            return "report";
        case "NEW_USER_REGISTERED":
            return "new_user";
        case "LISTING_APPROVED":
        case "LISTING_REJECTED":
        case "COMMENT_RECEIVED":
        default:
            return "comment";
    }
}

/* ---------- Icons ---------- */
const IconBubble = ({ variant = "default" }) => {
    switch (variant) {
        case "report":
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        case "new_user":
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-1 ring-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 21a8 8 0 0 0-16 0" />
                        <circle cx="10" cy="8" r="4" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="relative shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center ring-1 ring-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
            );
    }
};

export default function NotificationsCard() {
    const { data: apiData, isLoading, isError } = useGetNotificationsQuery();

    // Chuẩn hóa dữ liệu
    const items = useMemo(() => {
        const arr = Array.isArray(apiData) ? apiData : [];
        // Xác định thông báo mới nhất theo createdAt
        const latestTs = Math.max(
            0,
            ...arr.map((x) => (x?.createdAt ? new Date(x.createdAt).getTime() : 0)),
        );
        const latestId = arr.find((x) => new Date(x?.createdAt || 0).getTime() === latestTs)?.id;

        return arr.map((apiItem) => ({
            id: apiItem.id,
            type: mapApiTypeToIconType(apiItem.notificationType),
            text: apiItem.message,
            time: formatRelativeTime(apiItem.createdAt),
            link: apiItem.link,
            // hỗ trợ cả read/isRead từ BE (nếu có), mặc định là false (chưa đọc)
            read: Boolean(apiItem.read ?? apiItem.isRead ?? false),
            createdAt: apiItem.createdAt,
            isLatest: apiItem.id === latestId, // đánh dấu "mới nhận"
        }));
    }, [apiData]);

    const displayItems = items.slice(0, 4);

    const liClass = (it) => {
        // Nổi bật nhất cho "mới nhận"
        if (it.isLatest) {
            return [
                "relative",
                "flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl transition-colors",
                "bg-blue-50/70 hover:bg-blue-50",
                "ring-1 ring-blue-100",
                "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-blue-400/70",
            ].join(" ");
        }
        // Chưa đọc (không phải mới nhất): nhấn nhẹ
        if (!it.read) {
            return [
                "relative",
                "flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl transition-colors",
                "hover:bg-gray-50/70",
                "bg-gray-50",
            ].join(" ");
        }
        // Đã đọc: mặc định
        return "flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/70 transition-colors";
    };

    const Dot = ({ strong = false }) => (
        <span
            className={[
                "inline-block w-2 h-2 rounded-full",
                strong ? "bg-blue-500" : "bg-blue-400",
            ].join(" ")}
        />
    );

    const NewPing = () => (
        <span className="absolute -left-1 top-2.5">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
            </span>
        </span>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Thông báo mới</h3>
                <button
                    className="text-sm px-3 h-8 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
                    type="button"
                >
                    Xem tất cả
                </button>
            </div>

            {/* List */}
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
                {!isLoading && !isError && displayItems.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">
                        Chưa có thông báo mới
                    </li>
                )}

                {/* Data */}
                {!isLoading &&
                    !isError &&
                    displayItems.map((item) => (
                        <li key={item.id} className="relative">
                            <Link to={item.link || "#"} className={liClass(item)}>
                                {/* Ping “mới nhận” */}
                                {item.isLatest && <NewPing />}

                                {/* Icon */}
                                <IconBubble variant={item.type} />

                                {/* Nội dung */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        {/* Nhãn “Mới” cho item mới nhất */}
                                        {item.isLatest && (
                                            <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                                                Mới
                                            </span>
                                        )}

                                        <p
                                            className={[
                                                "font-medium text-sm leading-snug",
                                                item.isLatest ? "text-gray-900" : "text-gray-900",
                                            ].join(" ")}
                                            dangerouslySetInnerHTML={{ __html: item.text }}
                                        />
                                    </div>

                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                                        {/* Dot xanh cho “chưa đọc” (không phải mới nhất) */}
                                        {!item.isLatest && !item.read && <Dot />}
                                        <span>{item.time}</span>
                                    </div>
                                </div>

                                {/* Chevron */}
                                <svg
                                    className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition ml-2 mt-1 shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                        </li>
                    ))}
            </ul>
        </div>
    );
}
