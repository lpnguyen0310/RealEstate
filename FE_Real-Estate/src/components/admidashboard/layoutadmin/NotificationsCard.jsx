import React from "react";

function Icon({ type }) {
    switch (type) {
        case "report":
            return (
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-1 ring-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        case "new_user":
            return (
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-1 ring-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 21a8 8 0 0 0-16 0" />
                        <circle cx="10" cy="8" r="4" />
                    </svg>
                </div>
            );
        case "comment":
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

export default function NotificationsCard({ items = [] }) {
    const displayItems = items.slice(0, 4);

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

            <ul className="divide-y divide-gray-100">
                {displayItems.map((item, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-gray-50/70 transition-colors"
                    >
                        <Icon type={item.type} />
                        <div className="min-w-0">
                            <p
                                className="font-medium text-sm text-gray-900 leading-snug"
                                dangerouslySetInnerHTML={{ __html: item.text }}
                            />
                            <p className="text-xs text-gray-500 leading-none mt-1.5">
                                {item.time}
                            </p>
                        </div>
                    </li>
                ))}

                {items.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">Chưa có thông báo mới</li>
                )}
            </ul>
        </div>
    );
}
