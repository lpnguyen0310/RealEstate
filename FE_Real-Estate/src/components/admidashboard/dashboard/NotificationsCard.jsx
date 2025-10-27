import React from "react";
import { Link } from "react-router-dom";
// 1. Import hook từ file API của bạn
import { useGetNotificationsQuery } from "@/services/notificationApi"; // (Hãy đảm bảo đường dẫn này đúng)

// -----------------------------------------------------------------
// ++ HELPER: Component Skeleton cho trạng thái Đang Tải ++
// -----------------------------------------------------------------
const SkeletonItem = () => (
    <li className="flex items-start gap-3 py-3 px-2 -mx-2">
        <div className="shrink-0 w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="min-w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-2 animate-pulse"></div>
        </div>
    </li>
);

// -----------------------------------------------------------------
// ++ HELPER: Hàm chuyển đổi thời gian (độc lập, không cần thư viện) ++
// -----------------------------------------------------------------
function formatRelativeTime(isoDate) {
    if (!isoDate) return "";
    try {
        const date = new Date(isoDate);
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000; // 1 năm
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000; // 1 tháng
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400; // 1 ngày
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600; // 1 giờ
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60; // 1 phút
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vài giây trước";
    } catch (e) {
        return "Không rõ"; // Fallback
    }
}

// -----------------------------------------------------------------
// ++ HELPER: Map Enum từ Backend sang Icon Type của Frontend ++
// -----------------------------------------------------------------
function mapApiTypeToIconType(apiType) {
    const type = (apiType || "").toUpperCase();
    switch (type) {
        // Các loại này sẽ dùng icon màu đỏ (report)
        case "NEW_LISTING_PENDING": // Tin mới chờ duyệt
        case "REPORT_RECEIVED":     // Báo cáo mới
            return 'report';
        
        // Các loại này dùng icon màu xanh (new user)
        case "NEW_USER_REGISTERED": // User mới
            return 'new_user';

        // Các loại khác dùng icon xám (comment/default)
        case "LISTING_APPROVED":
        case "LISTING_REJECTED":
        case "COMMENT_RECEIVED":
        default:
            return 'comment';
    }
}

// -----------------------------------------------------------------
// ++ COMPONENT CHÍNH ++
// -----------------------------------------------------------------
export default function NotificationsCard() {
    
    // Gọi API hook
    const {
        data: apiData,
        isLoading,
        isError,
    } = useGetNotificationsQuery();

    // Map dữ liệu từ API sang định dạng 'items' component cần
    const items = (Array.isArray(apiData) ? apiData : []).map(apiItem => ({
        id: apiItem.id,
        type: mapApiTypeToIconType(apiItem.notificationType), // Dùng hàm map
        text: apiItem.message,                                // API 'message' -> FE 'text'
        time: formatRelativeTime(apiItem.createdAt),          // Dùng hàm format thời gian
        link: apiItem.link,                                   // Lấy link từ API
    }));
    
    // Component vẫn chỉ hiển thị 4 item mới nhất
    const displayItems = items.slice(0, 4);

    // Hàm helper để lấy icon dựa trên loại thông báo
    const getIcon = (type) => {
        switch (type) {
            case 'report':
                return (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'new_user':
                return (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-1 ring-blue-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 21a8 8 0 0 0-16 0" />
                            <circle cx="10" cy="8" r="4" />
                        </svg>
                    </div>
                );
            case 'comment':
            default:
                return (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center ring-1 ring-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                );
        }
    }

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
                
                {/* XỬ LÝ TRẠNG THÁI LOADING */}
                {isLoading && (
                    <>
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </>
                )}

                {/* XỬ LÝ TRẠNG THÁI LỖI */}
                {isError && (
                    <li className="py-6 text-center text-sm text-red-500">
                        Đã xảy ra lỗi khi tải thông báo.
                    </li>
                )}

                {/* XỬ LÝ KHI KHÔNG CÓ DỮ LIỆU */}
                {!isLoading && !isError && items.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">
                        Chưa có thông báo mới
                    </li>
                )}

                {/* HIỂN THỊ DỮ LIỆU KHI THÀNH CÔNG */}
                {!isLoading && !isError && displayItems.map((item) => (
                    <li key={item.id}> 
                        <Link
                            to={item.link || "#"} // Dùng link từ item
                            className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/70 transition-colors"
                        >
                            {getIcon(item.type)}
                            <div className="min-w-0">
                                <p 
                                    className="font-medium text-sm text-gray-900 leading-snug" 
                                    dangerouslySetInnerHTML={{ __html: item.text }} 
                                />
                                <p className="text-xs text-gray-500 leading-none mt-1.5">
                                    {item.time}
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}