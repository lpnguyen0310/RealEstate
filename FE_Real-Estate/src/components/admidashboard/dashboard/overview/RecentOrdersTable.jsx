import React from "react";
import { initials, vnd, fmtDate } from "./dashboardUtils";

export default function RecentOrdersTable({
    query,
    onQueryChange,
    data: { loading, error, content }
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Đơn hàng mới nhất
                </h3>
                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Tìm mã đơn (id)/khách hàng…"
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
                            <th className="py-3 px-4">Mã đơn</th>
                            <th className="py-3 px-4">Khách hàng</th>
                            <th className="py-3 px-4">Tổng tiền</th>
                            <th className="py-3 px-4">Trạng thái</th>
                            <th className="py-3 px-4">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    Đang tải…
                                </td>
                            </tr>
                        )}

                        {!loading && !error && content.map((o) => {
                            const name = o.customerName || o.userName || o.fullName || (o.userId != null ? `User #${o.userId}` : "");
                            return (
                                <tr key={o.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                                        {o.orderCode ?? `ORD-${String(o.id).padStart(6, "0")}`}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {initials(name) || "KH"}
                                            </div>
                                            <span className="text-gray-700 truncate" title={name}>
                                                {name || "(Ẩn danh)"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-gray-900 tabular-nums whitespace-nowrap">
                                        {vnd(o.total ?? 0)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 whitespace-nowrap ${o.status === "PAID"
                                                ? "bg-green-50 text-green-700 ring-green-100"
                                                : o.status?.startsWith("PENDING")
                                                    ? "bg-amber-50 text-amber-700 ring-amber-100"
                                                    : "bg-gray-50 text-gray-700 ring-gray-100"
                                                }`}
                                        >
                                            {o.status === "PAID"
                                                ? "Hoàn thành"
                                                : o.status?.startsWith("PENDING")
                                                    ? "Chờ xử lý"
                                                    : o.status || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                        {fmtDate(o.createdAt)}
                                    </td>
                                </tr>
                            );
                        })}

                        {!loading && !error && content.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    Không có đơn hàng phù hợp
                                </td>
                            </tr>
                        )}

                        {error && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}