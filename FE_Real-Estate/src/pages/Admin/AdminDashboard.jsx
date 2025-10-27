// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { kpiApi } from "@/api/adminApi/kpiApi";

import {
    StatCard,
    NotificationsCard,
    RecentTransactionsCard,
} from "@/components/admidashboard/layoutadmin";

const nfmt = (n) => new Intl.NumberFormat("vi-VN").format(n);
const vnd = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
const initials = (fullName = "") =>
    fullName.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export default function AdminDashboard() {
    const [range, setRange] = useState("last_30d");
    const [orderSearch, setOrderSearch] = useState("");
    const chartRef = useRef(null);

    /* ===================== KPI: NEW USERS ===================== */
    const [newUsers, setNewUsers] = useState({
        total: 0,
        compareToPrev: 0,
        series: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (mounted) setNewUsers((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getNewUsers(range);
                if (!mounted) return;
                setNewUsers({
                    total: data?.summary?.total ?? 0,
                    compareToPrev: data?.summary?.compareToPrev ?? 0,
                    series: Array.isArray(data?.series) ? data.series : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setNewUsers((s) => ({
                    ...s,
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được KPI",
                }));
            }
        })();
        return () => {
            mounted = false;
        };
    }, [range]);

    const newUsersCard = useMemo(() => {
        const total = newUsers.total ?? 0;
        const pct = Number(newUsers.compareToPrev ?? 0);
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(1)}% so với kỳ trước`;
        const spark = (newUsers.series || []).map((p) => p.count);
        const hint = newUsers.error ? `Lỗi: ${newUsers.error}` : newUsers.loading ? "Đang tải…" : pctText;
        return {
            title: "Người dùng mới",
            value: newUsers.loading ? "…" : nfmt(total),
            hint,
            trend,
            spark: spark.length ? spark : [1, 2, 1, 3, 2, 4, 5],
        };
    }, [newUsers]);

    /* ===================== KPI: ORDERS + REVENUE ===================== */
    const [orderKpi, setOrderKpi] = useState({
        orders: 0,
        revenue: 0,
        compareOrders: 0,
        compareRevenue: 0,
        series: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (mounted) setOrderKpi((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getOrders(range, "PAID");
                if (!mounted) return;
                setOrderKpi({
                    orders: data?.summary?.orders ?? 0,
                    revenue: data?.summary?.revenue ?? 0,
                    compareOrders: data?.summary?.compareOrders ?? 0,
                    compareRevenue: data?.summary?.compareRevenue ?? 0,
                    series: Array.isArray(data?.series) ? data.series : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setOrderKpi((s) => ({
                    ...s,
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được KPI đơn hàng",
                }));
            }
        })();
        return () => {
            mounted = false;
        };
    }, [range]);

    const ordersCard = useMemo(() => {
        const total = orderKpi.orders ?? 0;
        const pct = Number(orderKpi.compareOrders ?? 0);
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(1)}% so với kỳ trước`;
        const spark = (orderKpi.series || []).map((p) => p.orders);
        const hint = orderKpi.error ? `Lỗi: ${orderKpi.error}` : orderKpi.loading ? "Đang tải…" : pctText;
        return {
            title: "Đơn hàng mới",
            value: orderKpi.loading ? "…" : nfmt(total),
            hint,
            trend,
            spark: spark.length ? spark : [2, 1, 3, 2, 4, 5, 3],
            trendColor: trend === "down" ? "text-red-500" : "text-green-600",
        };
    }, [orderKpi]);

    const revenueCard = useMemo(() => {
        const totalVnd = orderKpi.revenue ?? 0;
        const pct = Number(orderKpi.compareRevenue ?? 0);
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && totalVnd === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(1)}% so với kỳ trước`;
        const spark = (orderKpi.series || []).map((p) => Math.round((p.revenue ?? 0) / 1_000_000));
        const hint = orderKpi.error ? `Lỗi: ${orderKpi.error}` : orderKpi.loading ? "Đang tải…" : pctText;
        return {
            title: "Doanh thu",
            value: orderKpi.loading ? "…" : vnd(totalVnd),
            hint,
            trend,
            spark: spark.length ? spark : [60, 63, 66, 70, 73, 75],
        };
    }, [orderKpi]);

    /* ===================== KPI: PROPERTIES ===================== */
    const [propKpi, setPropKpi] = useState({
        total: 0,
        compareToPrev: 0,
        pending: 0,
        series: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (mounted) setPropKpi((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getProperties(range, "PUBLISHED", "PENDING_REVIEW");
                if (!mounted) return;
                setPropKpi({
                    total: data?.summary?.total ?? 0,
                    compareToPrev: data?.summary?.compareToPrev ?? 0,
                    pending: data?.summary?.pending ?? 0,
                    series: Array.isArray(data?.series) ? data.series : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setPropKpi((s) => ({
                    ...s,
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được KPI tin đăng",
                }));
            }
        })();
        return () => {
            mounted = false;
        };
    }, [range]);

    const newPostsCard = useMemo(() => {
        const total = propKpi.total ?? 0;
        const pct = Number(propKpi.compareToPrev ?? 0);
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(1)}% so với kỳ trước`;
        const seriesCounts = (propKpi.series || []).map((p) => p.count ?? 0);
        const hasSeries = seriesCounts.length > 0;
        const allZero = hasSeries && seriesCounts.every((v) => (v ?? 0) === 0);
        const spark = hasSeries ? (allZero ? [0] : seriesCounts) : [0];
        const hint = propKpi.error
            ? `Lỗi: ${propKpi.error}`
            : propKpi.loading
                ? "Đang tải…"
                : `${pctText} · ${propKpi.pending ?? 0} tin đang chờ duyệt`;
        return {
            title: "Tin đăng mới",
            value: propKpi.loading ? "…" : nfmt(total),
            hint,
            trend,
            spark,
            lineColor: "#6366f1",
        };
    }, [propKpi]);

    /* ===================== Chart doanh thu theo ngày ===================== */
    const revenueChart = useMemo(() => {
        const series = Array.isArray(orderKpi.series) ? orderKpi.series : [];
        const labels = series.map((p) => p.date);
        const data = series.map((p) => Math.round((p.revenue ?? 0) / 1_000_000));
        return {
            data: {
                labels,
                datasets: [
                    {
                        label: "Doanh thu (triệu VND) • theo ngày",
                        data,
                        fill: true,
                        backgroundColor: "rgba(59,130,246,0.08)",
                        borderColor: "rgba(59,130,246,0.7)",
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: "#6b7280" } },
                    x: { grid: { display: false }, ticks: { color: "#6b7280", maxRotation: 0, autoSkip: true } },
                },
                plugins: { legend: { display: false } },
            },
        };
    }, [orderKpi.series]);

    /* ===================== Tin chờ duyệt ===================== */
    const [pendingQ, setPendingQ] = useState("");
    const [pendingList, setPendingList] = useState({
        content: [],
        page: 0,
        size: 8,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        const timer = setTimeout(async () => {
            try {
                if (mounted) setPendingList((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getPendingProperties({ q: pendingQ, page: 0, size: 8 });
                if (!mounted) return;
                setPendingList({
                    content: Array.isArray(data?.content) ? data.content : [],
                    page: data?.page ?? 0,
                    size: data?.size ?? 8,
                    totalElements: data?.totalElements ?? 0,
                    totalPages: data?.totalPages ?? 0,
                    first: !!data?.first,
                    last: !!data?.last,
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setPendingList((s) => ({
                    ...s,
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được danh sách tin chờ duyệt",
                }));
            }
        }, 300);
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [pendingQ]);

    /* ===================== Đơn hàng mới nhất ===================== */
    const [recentOrders, setRecentOrders] = useState({
        content: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        const t = setTimeout(async () => {
            try {
                if (mounted) setRecentOrders((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getRecentOrders({ q: orderSearch, page: 0, size: 8 });
                if (!mounted) return;
                setRecentOrders({
                    content: Array.isArray(data?.content) ? data.content : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setRecentOrders((s) => ({
                    ...s,
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được đơn hàng mới",
                }));
            }
        }, 300); // debounce
        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, [orderSearch]);


    // ---- state: recent transactions (from BE) ----
    const [recentTx, setRecentTx] = useState({ rows: [], loading: false, error: null });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (mounted) setRecentTx((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getRecentTransactions({ status: "PAID", page: 0, size: 4 });
                if (!mounted) return;

                // data = List<RecentTransactionDto>
                const rows = Array.isArray(data) ? data : [];

                // map về format RecentTransactionsCard
                const items = rows.map((r) => ({
                    ini: initials(r.userName || r.email || "U"),
                    iniBg: "bg-indigo-100",
                    iniText: "text-indigo-600",
                    name: r.userName || r.email || "Người dùng",
                    desc: r.title || "Giao dịch",
                    amount: `+${vnd(r.amount || 0)}`,
                    time: new Date(r.createdAt).toLocaleString("vi-VN"),
                    wallet: "ví MoMo", // nếu BE có cổng thanh toán thì thay ở đây
                }));

                setRecentTx({ rows: items, loading: false, error: null });
            } catch (e) {
                if (!mounted) return;
                setRecentTx({
                    rows: [],
                    loading: false,
                    error: e?.response?.data?.message || e?.message || "Không tải được giao dịch",
                });
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="bg-[#f5f7fb] min-h-screen">
            {/* HEADER: kỳ KPI */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-inset transition"
                >
                    <option value="today">Hôm nay</option>
                    <option value="last_7d">7 ngày qua</option>
                    <option value="last_30d">30 ngày qua</option>
                    <option value="this_month">Tháng này</option>
                </select>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    {...newUsersCard}
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
                    {...revenueCard}
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
                    {...newPostsCard}
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
                    {...ordersCard}
                    iconBg="bg-amber-100 text-amber-600"
                    lineColor="#f59e0b"
                    trendColor={ordersCard.trendColor}
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
                <div className="lg:col-span-2">
                    <NotificationsCard
                        items={[
                            { type: "report", text: "<strong>Nguyễn Văn An</strong> đã gửi một báo cáo cho tin đăng 'Bán nhà quận 1...'", time: "5 phút trước" },
                            { type: "new_user", text: "<strong>Trần Thị Bình</strong> vừa đăng ký tài khoản mới.", time: "1 giờ trước" },
                            { type: "comment", text: "<strong>Lê Văn Cường</strong> đã bình luận về một tin đăng.", time: "3 giờ trước" },
                            { type: "report", text: "Tin đăng 'Cho thuê chung cư...' đã nhận được <strong>3 báo cáo</strong>.", time: "1 ngày trước" },
                        ]}
                    />
                </div>

                <div className="lg:col-span-2">
                    <RecentTransactionsCard
                        items={
                            recentTx.loading
                                ? [] // card có skeleton nhẹ: bạn có thể thay bằng 4 item “Đang tải…”
                                : recentTx.rows
                        }
                    />
                    {recentTx.error && (
                        <div className="mt-2 text-sm text-red-600">{recentTx.error}</div>
                    )}
                </div>

                {/* Biểu đồ Doanh thu */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Phân tích doanh thu theo ngày</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Nguồn dữ liệu: đơn hàng (status=PAID) • Kỳ: {range}</p>
                    <div className="h-80 w-full">
                        <Line ref={chartRef} data={revenueChart.data} options={revenueChart.options} />
                    </div>
                </div>

                {/* Tin đăng mới cần duyệt */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Tin đăng mới cần duyệt</h3>
                            <div className="relative">
                                <input
                                    value={pendingQ}
                                    onChange={(e) => setPendingQ(e.target.value)}
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
                                    {pendingList.loading && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">
                                                Đang tải…
                                            </td>
                                        </tr>
                                    )}
                                    {!pendingList.loading &&
                                        !pendingList.error &&
                                        pendingList.content.map((p) => (
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
                                                <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{p.postedDate || "—"}</td>
                                            </tr>
                                        ))}
                                    {!pendingList.loading && !pendingList.error && pendingList.content.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">
                                                Không có tin phù hợp
                                            </td>
                                        </tr>
                                    )}
                                    {pendingList.error && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-red-500">
                                                {pendingList.error}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">Tổng: {pendingList.totalElements} tin cần duyệt</div>
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
                                    placeholder="Tìm mã đơn (id)/khách hàng…"
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
                                        <th className="py-3 px-4">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentOrders.loading && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                Đang tải…
                                            </td>
                                        </tr>
                                    )}

                                    {!recentOrders.loading &&
                                        !recentOrders.error &&
                                        recentOrders.content.map((o) => {
                                            const name =
                                                o.customerName || o.userName || o.fullName || (o.userId != null ? `User #${o.userId}` : "");
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
                                                            {o.status === "PAID" ? "Hoàn thành" : o.status?.startsWith("PENDING") ? "Chờ xử lý" : (o.status || "—")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                                                </tr>
                                            );
                                        })}

                                    {!recentOrders.loading && !recentOrders.error && recentOrders.content.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                Không có đơn hàng phù hợp
                                            </td>
                                        </tr>
                                    )}

                                    {recentOrders.error && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-red-500">
                                                {recentOrders.error}
                                            </td>
                                        </tr>
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
