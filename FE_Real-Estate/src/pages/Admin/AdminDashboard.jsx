import React, { useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

import {
    StatCard,
    NotificationsCard,
    RecentTransactionsCard,
} from "@/components/admidashboard/layoutadmin";

export default function AdminDashboard() {
    const [range, setRange] = useState("last_30d");
    const [postSearch, setPostSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const chartRef = useRef(null);

    const kpis = {
        newUsers: {
            title: "Người dùng mới",
            value: "1,250",
            hint: "+15.3% so với tháng trước",
            trend: "up",
            spark: [15, 20, 25, 24, 28, 30, 34, 38, 40],
        },
        revenue: {
            title: "Doanh thu",
            value: "150.000.000đ",
            hint: "+8.2% so với tháng trước",
            trend: "up",
            spark: [60, 63, 66, 70, 73, 75, 80, 84, 90],
        },
        newPosts: {
            title: "Tin đăng mới",
            value: "3,420",
            hint: "12 tin đang chờ duyệt",
            trend: "up",
            spark: [3000, 3100, 3150, 3200, 3300, 3400],
        },
        newOrders: {
            title: "Đơn hàng mới",
            value: "56",
            hint: "-2.1% so với hôm qua",
            trend: "down",
            spark: [58, 57, 56, 55, 56, 54, 55],
        },
    };

    // Chart doanh thu (demo)
    const chart = useMemo(() => {
        const labels = [
            "Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6",
            "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"
        ];
        const data = [65, 59, 80, 81, 56, 55, 40, 60, 75, 90, 110, 120];

        return {
            data: {
                labels,
                datasets: [
                    {
                        label: "Doanh thu (triệu VND)",
                        data,
                        fill: true,
                        backgroundColor: "rgba(59,130,246,0.08)",
                        borderColor: "rgba(59,130,246,0.7)",
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: "#6b7280" } },
                    x: { grid: { display: false }, ticks: { color: "#6b7280" } },
                },
                plugins: { legend: { display: false } },
            },
        };
    }, []);

    const pendingPosts = [
        { title: "Bán nhà quận 1, 100m2, gần trung tâm, sổ hồng chính chủ...", user: "Nguyễn Văn An", date: "20/10/2025" },
        { title: "Cho thuê chung cư mini full nội thất, gần ĐH KT, giá tốt...", user: "Trần Thị Bình", date: "20/10/2025" },
        { title: "Đất nền dự án giá tốt, pháp lý rõ ràng, hạ tầng hoàn thiện...", user: "Lê Văn Cường", date: "19/10/2025" },
    ];

    const recentOrders = [
        { code: "#ORD-0125", customer: "Nguyễn Văn An", total: "500.000đ", status: "Hoàn thành", badge: "green" },
        { code: "#ORD-0124", customer: "Trần Thị Bình", total: "50.000đ", status: "Hoàn thành", badge: "green" },
        { code: "#ORD-0123", customer: "Lê Văn Cường", total: "1.200.000đ", status: "Chờ xử lý", badge: "yellow" },
    ];

    const notifications = [
        { type: "report", text: "<strong>Nguyễn Văn An</strong> đã gửi một báo cáo cho tin đăng 'Bán nhà quận 1...'", time: "5 phút trước" },
        { type: "new_user", text: "<strong>Trần Thị Bình</strong> vừa đăng ký tài khoản mới.", time: "1 giờ trước" },
        { type: "comment", text: "<strong>Lê Văn Cường</strong> đã bình luận về một tin đăng.", time: "3 giờ trước" },
        { type: "report", text: "Tin đăng 'Cho thuê chung cư...' đã nhận được <strong>3 báo cáo</strong>.", time: "1 ngày trước" },
    ];

    // Filter FE-only
    const filteredPosts = pendingPosts.filter(
        (p) =>
            p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
            p.user.toLowerCase().includes(postSearch.toLowerCase())
    );
    const filteredOrders = recentOrders.filter(
        (o) =>
            o.code.toLowerCase().includes(orderSearch.toLowerCase()) ||
            o.customer.toLowerCase().includes(orderSearch.toLowerCase())
    );

    return (
        <div className="bg-[#f5f7fb] min-h-screen">
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    {...kpis.newUsers}
                    iconBg="bg-blue-100 text-blue-600"
                    lineColor="#3b82f6"
                    gradientFrom="from-blue-50"
                    gradientTo="to-white"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M18 21a8 8 0 0 0-16 0" />
                            <circle cx="10" cy="8" r="4" />
                        </svg>
                    }
                />
                <StatCard
                    {...kpis.revenue}
                    iconBg="bg-green-100 text-green-600"
                    lineColor="#22c55e"
                    gradientFrom="from-green-50"
                    gradientTo="to-white"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M21 12a9 9 0 0 0-9-9h-1a9 9 0 0 0-9 9v1a9 9 0 0 0 9 9h1a9 9 0 0 0 9-9Z" />
                        </svg>
                    }
                />
                <StatCard
                    {...kpis.newPosts}
                    iconBg="bg-indigo-100 text-indigo-600"
                    lineColor="#6366f1"
                    gradientFrom="from-indigo-50"
                    gradientTo="to-white"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect width="7" height="7" x="3" y="3" rx="1" />
                            <rect width="7" height="7" x="3" y="14" rx="1" />
                            <path d="M14 4h7M14 9h7M14 15h7M14 20h7" />
                        </svg>
                    }
                />
                <StatCard
                    {...kpis.newOrders}
                    iconBg="bg-amber-100 text-amber-600"
                    lineColor="#f59e0b"
                    trendColor="text-red-500"
                    gradientFrom="from-amber-50"
                    gradientTo="to-white"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="8" cy="21" r="1" />
                            <circle cx="19" cy="21" r="1" />
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        </svg>
                    }
                />
            </div>

            {/* Layout chính */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Thông báo mới */}
                <div className="lg:col-span-2">
                    <NotificationsCard items={notifications} />
                </div>

                {/* Giao dịch gần đây */}
                <div className="lg:col-span-2">
                    <RecentTransactionsCard
                        items={
                            recentOrders.length
                                ? [
                                    { ini: "AV", iniBg: "bg-blue-100", iniText: "text-blue-600", name: "Nguyễn Văn An", desc: "Mua gói tin VIP", amount: "+500.000đ" },
                                    { ini: "TB", iniBg: "bg-indigo-100", iniText: "text-indigo-600", name: "Trần Thị Bình", desc: "Đăng tin thường", amount: "+50.000đ" },
                                    { ini: "LC", iniBg: "bg-amber-100", iniText: "text-amber-600", name: "Lê Văn Cường", desc: "Mua gói tin đặc biệt", amount: "+1.200.000đ" },
                                    { ini: "HD", iniBg: "bg-pink-100", iniText: "text-pink-600", name: "Hồ Thị Dung", desc: "Up tin lên top", amount: "+100.000đ" },
                                ]
                                : []
                        }
                    />
                </div>

                {/* Biểu đồ doanh thu */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Phân tích doanh thu</h3>
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Hôm nay</option>
                            <option value="last_7d">7 ngày qua</option>
                            <option value="last_30d">30 ngày qua</option>
                            <option value="this_month">Tháng này</option>
                            <option value="last_month">Tháng trước</option>
                        </select>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Dữ liệu trong 12 tháng gần nhất</p>
                    <div className="h-80 w-full">
                        <Line ref={chartRef} data={chart.data} options={chart.options} />
                    </div>
                </div>

                {/* Tin cần duyệt */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Tin đăng mới cần duyệt</h3>
                            <div className="relative">
                                <input
                                    value={postSearch}
                                    onChange={(e) => setPostSearch(e.target.value)}
                                    placeholder="Tìm tiêu đề/người đăng…"
                                    className="h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                    {filteredPosts.map((p, i) => (
                                        <tr key={i} className={`bg-white hover:bg-slate-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                <div className="max-w-xs truncate" title={p.title}>{p.title}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {p.user.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                                                    </div>
                                                    <span className="text-gray-700 truncate" title={p.user}>{p.user}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{p.date}</td>
                                        </tr>
                                    ))}
                                    {filteredPosts.length === 0 && (
                                        <tr><td colSpan={3} className="py-8 text-center text-gray-500">Không có tin phù hợp</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Đơn hàng mới nhất */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Đơn hàng mới nhất</h3>
                            <div className="relative">
                                <input
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder="Tìm mã đơn/khách hàng…"
                                    className="h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map((o, i) => (
                                        <tr key={i} className={`bg-white hover:bg-slate-50 transition-colors ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                                            <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">{o.code}</td>
                                            <td className="py-3 px-4">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                        {o.customer.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                                                    </div>
                                                    <span className="text-gray-700 truncate" title={o.customer}>{o.customer}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-gray-900 tabular-nums whitespace-nowrap">{o.total}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 whitespace-nowrap ${o.badge === "green"
                                                            ? "bg-green-50 text-green-700 ring-green-100"
                                                            : o.badge === "yellow"
                                                                ? "bg-amber-50 text-amber-700 ring-amber-100"
                                                                : "bg-gray-50 text-gray-700 ring-gray-100"
                                                        }`}
                                                >
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr><td colSpan={4} className="py-8 text-center text-gray-500">Không có đơn hàng phù hợp</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
