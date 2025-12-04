import React from "react";
import { initials } from "./dashboardUtils";

export default function PendingPropertiesTable({
    query,
    onQueryChange,
    data: { loading, error, content, totalElements }
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Tin đăng mới cần duyệt
                </h3>
                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Tìm tiêu đề/người đăng…"
                        className="h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            <div className="relative overflow-x-auto rounded-xl ring-1 ring-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4">Tiêu đề</th>
                            <th className="py-3 px-4">Người đăng</th>
                            <th className="py-3 px-4">Ngày đăng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-gray-500">
                                    Đang tải…
                                </td>
                            </tr>
                        )}
                        {!loading && !error && content.map((p) => (
                            <tr key={p.id} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900">
                                    <div className="max-w-xs truncate" title={p.title}>
                                        {p.title}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="inline-flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {initials(p.author)}
                                        </div>
                                        <span className="text-gray-700 truncate" title={p.author}>
                                            {p.author}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                    {p.postedDate || "—"}
                                </td>
                            </tr>
                        ))}
                        {!loading && !error && content.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-gray-500">
                                    Không có tin phù hợp
                                </td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-3 text-xs text-gray-500">
                Tổng: {totalElements} tin cần duyệt
            </div>
        </div>
    );
}