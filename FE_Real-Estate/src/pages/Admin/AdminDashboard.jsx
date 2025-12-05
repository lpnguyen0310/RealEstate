import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "chart.js/auto";

// External APIs & Utils
import { kpiApi } from "@/api/adminApi/kpiApi";
import { nfmt, vnd } from "../../components/admidashboard/dashboard/overview/dashboardUtils";

// Custom Components
import NotificationsCard from "@/components/admidashboard/dashboard/NotificationsCard";
import {
    StatCard,
    RecentTransactionsCard,
    // RecentOrdersTable,
    // PendingPropertiesTable,
} from "../../components/admidashboard/dashboard/overview";
import ReviewAnalyticsCard from "../../components/admidashboard/dashboard/ReviewAnalyticsCard";

export default function AdminDashboard() {
    const [range, setRange] = useState("last_30d");
    const chartRef = useRef(null);

    /* ===================== KPI: NEW USERS ===================== */
    const [newUsers, setNewUsers] = useState({
        total: 0,
        compareToPrev: 0,
        previousTotal: 0,
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
                    previousTotal: data?.summary?.previousTotal ?? 0,
                    series: Array.isArray(data?.series) ? data.series : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setNewUsers((s) => ({
                    ...s,
                    loading: false,
                    error:
                        e?.response?.data?.message || e?.message || "Không tải được KPI",
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
        const prevTotal = newUsers.previousTotal ?? 0;
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(
                    1
                )}% so với kỳ trước`;
        const spark = (newUsers.series || []).map((p) => p.count);
        const hint = newUsers.error
            ? `Lỗi: ${newUsers.error}`
            : newUsers.loading
                ? "Đang tải…"
                : pctText;
        return {
            title: "Người dùng mới",
            value: newUsers.loading ? "…" : nfmt(total),
            hint,
            trend,
            spark: spark.length ? spark : [1, 2, 1, 3, 2, 4, 5],
            prevValue: newUsers.loading ? null : prevTotal,
            valueFormatter: nfmt,
            trendColor: trend === "down" ? "text-red-500" : "text-green-600",
        };
    }, [newUsers]);

    /* ===================== KPI: ORDERS + REVENUE ===================== */
    const [orderKpi, setOrderKpi] = useState({
        orders: 0,
        revenue: 0,
        compareOrders: 0,
        compareRevenue: 0,
        previousOrders: 0,
        previousRevenue: 0,
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
                    previousOrders: data?.summary?.previousOrders ?? 0,
                    previousRevenue: data?.summary?.previousRevenue ?? 0,
                    series: Array.isArray(data?.series) ? data.series : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setOrderKpi((s) => ({
                    ...s,
                    loading: false,
                    error:
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được KPI đơn hàng",
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
        const prevTotal = orderKpi.previousOrders ?? 0;
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(
                    1
                )}% so với kỳ trước`;
        const spark = (orderKpi.series || []).map((p) => p.orders);
        const hint = orderKpi.error
            ? `Lỗi: ${orderKpi.error}`
            : orderKpi.loading
                ? "Đang tải…"
                : pctText;
        return {
            title: "Đơn hàng mới",
            value: orderKpi.loading ? "…" : nfmt(total),
            hint,
            trend,
            spark: spark.length ? spark : [2, 1, 3, 2, 4, 5, 3],
            trendColor: trend === "down" ? "text-red-500" : "text-green-600",
            prevValue: orderKpi.loading ? null : prevTotal,
            valueFormatter: nfmt,
        };
    }, [orderKpi]);

    const revenueCard = useMemo(() => {
        const totalVnd = orderKpi.revenue ?? 0;
        const pct = Number(orderKpi.compareRevenue ?? 0);
        const prevTotal = orderKpi.previousRevenue ?? 0;
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && totalVnd === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(
                    1
                )}% so với kỳ trước`;
        const spark = (orderKpi.series || []).map((p) =>
            Math.round((p.revenue ?? 0) / 1_000_000)
        );
        const hint = orderKpi.error
            ? `Lỗi: ${orderKpi.error}`
            : orderKpi.loading
                ? "Đang tải…"
                : pctText;
        return {
            title: "Doanh thu",
            value: orderKpi.loading ? "…" : vnd(totalVnd),
            hint,
            trend,
            spark: spark.length ? spark : [60, 63, 66, 70, 73, 75],
            prevValue: orderKpi.loading ? null : prevTotal,
            valueFormatter: vnd,
            trendColor: trend === "down" ? "text-red-500" : "text-green-600",
        };
    }, [orderKpi]);

    /* ===================== KPI: PROPERTIES ===================== */
    const [propKpi, setPropKpi] = useState({
        total: 0,
        compareToPrev: 0,
        previousTotal: 0,
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
                const { data } = await kpiApi.getProperties(
                    range,
                    "PUBLISHED",
                    "PENDING_REVIEW"
                );
                if (!mounted) return;
                setPropKpi({
                    total: data?.summary?.total ?? 0,
                    compareToPrev: data?.summary?.compareToPrev ?? 0,
                    previousTotal: data?.summary?.previousTotal ?? 0,
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
                    error:
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được KPI tin đăng",
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
        const prevTotal = propKpi.previousTotal ?? 0;
        const trend = pct < 0 ? "down" : "up";
        const pctText =
            pct === 0 && total === 0
                ? "—"
                : `${trend === "down" ? "-" : "+"}${(Math.abs(pct) * 100).toFixed(
                    1
                )}% so với kỳ trước`;
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
            prevValue: propKpi.loading ? null : prevTotal,
            valueFormatter: nfmt,
            trendColor: trend === "down" ? "text-red-500" : "text-green-600",
        };
    }, [propKpi]);

    /* ===================== Biểu đồ DOANH THU THEO NGÀY (BAR + LINE) ===================== */
    const revenueChart = useMemo(() => {
        const series = Array.isArray(orderKpi.series) ? orderKpi.series : [];
        const labels = series.map((p) => p.date);

        const revenueData = series.map((p) =>
            Math.round((p.revenue ?? 0) / 1_000_000)
        );
        const ordersData = series.map((p) => p.orders ?? 0);

        return {
            data: {
                labels,
                datasets: [
                    {
                        type: "bar",
                        label: "Doanh thu (triệu VND)",
                        data: revenueData,
                        yAxisID: "y",
                        borderRadius: 10,
                        borderSkipped: false,
                        maxBarThickness: 26,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return "rgba(37,99,235,0.2)";
                            const gradient = ctx.createLinearGradient(
                                0,
                                chartArea.top,
                                0,
                                chartArea.bottom
                            );
                            gradient.addColorStop(0, "rgba(37,99,235,0.9)");
                            gradient.addColorStop(1, "rgba(59,130,246,0.15)");
                            return gradient;
                        },
                        hoverBackgroundColor: "rgba(37,99,235,0.95)",
                    },
                    {
                        type: "line",
                        label: "Số đơn hàng",
                        data: ordersData,
                        yAxisID: "y1",
                        borderColor: "rgba(250,204,21,1)",
                        backgroundColor: "rgba(250,204,21,0.25)",
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 4,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: { font: { size: 12 } },
                    },
                    tooltip: {
                        backgroundColor: "rgba(15,23,42,0.9)",
                        titleFont: { size: 12, weight: "600" },
                        bodyFont: { size: 12 },
                        padding: 10,
                        callbacks: {
                            label: (ctx) => {
                                const val = ctx.parsed.y ?? 0;

                                if (ctx.dataset.yAxisID === "y") {
                                    return `Doanh thu: ${val.toLocaleString(
                                        "vi-VN"
                                    )} triệu`;
                                }
                                const rounded = Math.round(val);
                                return `Số đơn: ${rounded.toLocaleString(
                                    "vi-VN"
                                )} đơn`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: "#6b7280",
                            maxRotation: 0,
                            autoSkip: true,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(148,163,184,0.25)",
                            drawBorder: false,
                        },
                        ticks: {
                            color: "#6b7280",
                            callback: (value) => `${value} tr`,
                        },
                    },
                    y1: {
                        beginAtZero: true,
                        position: "right",
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: "#f59e0b",
                            stepSize: 1,
                            precision: 0,
                            callback: (value) =>
                                `${Math.round(value).toLocaleString("vi-VN")} đơn`,
                        },
                    },
                },
            },
        };
    }, [orderKpi.series]);

    /* ========= Biểu đồ Tin đăng trong kỳ (Bar ngang 3 cột) ========= */
    const pendingSummaryChart = useMemo(() => {
        const total = propKpi.total ?? 0;
        const pending = propKpi.pending ?? 0;
        const approved = Math.max(total - pending, 0);

        const noData = total === 0 && pending === 0 && approved === 0;

        if (noData) {
            return {
                data: {
                    labels: ["Không có dữ liệu"],
                    datasets: [
                        {
                            label: "Số tin",
                            data: [0],
                            backgroundColor: ["rgba(148,163,184,0.4)"],
                            borderRadius: 12,
                            maxBarThickness: 32,
                        },
                    ],
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "rgba(15,23,42,0.9)",
                            bodyFont: { size: 12 },
                            padding: 8,
                        },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: "rgba(148,163,184,0.25)", drawBorder: false },
                            ticks: { color: "#6b7280", stepSize: 1, precision: 0 },
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: "#6b7280" },
                        },
                    },
                },
            };
        }

        const labels = ["Tổng tin trong kỳ", "Tin đã duyệt", "Tin chờ duyệt"];
        const values = [total, approved, pending];

        const colors = [
            "rgba(59,130,246,0.9)",
            "rgba(16,185,129,0.9)",
            "rgba(239,68,68,0.9)",
        ];
        const hoverColors = colors.map((c) => c.replace("0.9", "1"));

        return {
            data: {
                labels,
                datasets: [
                    {
                        label: "Số tin",
                        data: values,
                        backgroundColor: colors,
                        hoverBackgroundColor: hoverColors,
                        borderRadius: 12,
                        maxBarThickness: 32,
                    },
                ],
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(15,23,42,0.9)",
                        bodyFont: { size: 12 },
                        padding: 10,
                        callbacks: {
                            label: (ctx) =>
                                `Số tin: ${Math.round(
                                    ctx.parsed.x ?? 0
                                ).toLocaleString("vi-VN")} tin`,
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(148,163,184,0.25)",
                            drawBorder: false,
                        },
                        ticks: {
                            color: "#6b7280",
                            stepSize: 1,
                            precision: 0,
                        },
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: "#6b7280",
                        },
                    },
                },
            },
        };
    }, [propKpi.total, propKpi.pending]);

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
                if (mounted)
                    setRecentOrders((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getRecentOrders({
                    q: "",
                    page: 0,
                    size: 8,
                });
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
                    error:
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được đơn hàng mới",
                }));
            }
        }, 300);
        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, []);

    /* ========= Biểu đồ tròn: phân bố trạng thái đơn hàng mới nhất ========= */
    const recentOrdersStatusChart = useMemo(() => {
        const rows = Array.isArray(recentOrders.content)
            ? recentOrders.content
            : [];

        const map = new Map();

        const normalizeStatus = (raw) => {
            if (!raw) return "Khác";
            const s = String(raw).toUpperCase();
            if (s.includes("PAID") || s.includes("SUCCESS")) return "Đã thanh toán";
            if (s.includes("PENDING") || s.includes("PROCESS")) return "Đang xử lý";
            if (s.includes("CANCEL")) return "Đã hủy";
            if (s.includes("REFUND")) return "Hoàn tiền";
            return raw;
        };

        rows.forEach((o) => {
            const raw = o.status || o.orderStatus || o.paymentStatus || "Khác";
            const key = normalizeStatus(raw);
            map.set(key, (map.get(key) || 0) + 1);
        });

        if (map.size === 0) {
            return {
                data: {
                    labels: ["Không có dữ liệu"],
                    datasets: [
                        {
                            data: [1],
                            backgroundColor: ["rgba(148,163,184,0.4)"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                    },
                },
            };
        }

        const labels = Array.from(map.keys());
        const values = Array.from(map.values());

        const palette = [
            "rgba(16,185,129,0.9)",
            "rgba(59,130,246,0.9)",
            "rgba(249,115,22,0.9)",
            "rgba(239,68,68,0.9)",
            "rgba(139,92,246,0.9)",
        ];
        const bgColors = labels.map((_, idx) => palette[idx % palette.length]);
        const hoverColors = bgColors.map((c) => c.replace("0.9", "1"));

        return {
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: bgColors,
                        hoverBackgroundColor: hoverColors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "right",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 12,
                            font: { size: 12 },
                        },
                    },
                    tooltip: {
                        backgroundColor: "rgba(15,23,42,0.9)",
                        bodyFont: { size: 12 },
                        padding: 10,
                        callbacks: {
                            label: (ctx) => {
                                const label = ctx.label || "";
                                const value = ctx.parsed || 0;
                                const total = values.reduce((a, b) => a + b, 0) || 1;
                                const pct = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} đơn (${pct}%)`;
                            },
                        },
                    },
                },
            },
        };
    }, [recentOrders.content]);

    const recentOrdersSummary = useMemo(() => {
        const rows = Array.isArray(recentOrders.content)
            ? recentOrders.content
            : [];
        const totalCount = rows.length;
        const totalAmount = rows.reduce((sum, o) => {
            const amt = o.totalAmount ?? o.amount ?? 0;
            return sum + (amt || 0);
        }, 0);
        return { totalCount, totalAmount };
    }, [recentOrders.content]);

    /* ===================== Thống kê gói tin ===================== */
    const [packageStats, setPackageStats] = useState({
        rows: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (mounted)
                    setPackageStats((s) => ({ ...s, loading: true, error: null }));
                const { data } = await kpiApi.getPackageStats("PAID");
                if (!mounted) return;
                setPackageStats({
                    rows: Array.isArray(data) ? data : [],
                    loading: false,
                    error: null,
                });
            } catch (e) {
                if (!mounted) return;
                setPackageStats((s) => ({
                    ...s,
                    loading: false,
                    error:
                        e?.response?.data?.message ||
                        e?.message ||
                        "Không tải được thống kê gói tin",
                }));
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="bg-[#f5f7fb] min-h-screen">
            {/* HEADER: kỳ KPI */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-inset transition"
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
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
                            {
                                type: "report",
                                text: "<strong>Nguyễn Văn An</strong> đã gửi một báo cáo cho tin đăng 'Bán nhà quận 1...'",
                                time: "5 phút trước",
                            },
                            {
                                type: "new_user",
                                text: "<strong>Trần Thị Bình</strong> vừa đăng ký tài khoản mới.",
                                time: "1 giờ trước",
                            },
                            {
                                type: "comment",
                                text: "<strong>Lê Văn Cường</strong> đã bình luận về một tin đăng.",
                                time: "3 giờ trước",
                            },
                            {
                                type: "report",
                                text: "Tin đăng 'Cho thuê chung cư...' đã nhận được <strong>3 báo cáo</strong>.",
                                time: "1 ngày trước",
                            },
                        ]}
                    />
                </div>

                <div className="lg:col-span-2">
                    <RecentTransactionsCard
                        items={packageStats.rows}
                        loading={packageStats.loading}
                    />
                    {packageStats.error && (
                        <div className="mt-2 text-sm text-red-600">
                            {packageStats.error}
                        </div>
                    )}
                </div>

                {/* Biểu đồ Doanh thu + Đánh giá hệ thống */}
                <div className="lg:col-span-1">
                    <ReviewAnalyticsCard />
                </div>
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Phân tích doanh thu theo ngày
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Nguồn dữ liệu: đơn hàng (status=PAID) • Kỳ: {range}
                    </p>
                    <div className="h-80 w-full">
                        <Bar
                            ref={chartRef}
                            data={revenueChart.data}
                            options={revenueChart.options}
                        />
                    </div>
                </div>

                {/* Tin đăng trong kỳ -> Bar ngang 3 cột */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Tình trạng tin đăng trong kỳ
                            </h3>
                            <p className="text-sm text-gray-500">
                                Tổng tin: {nfmt(propKpi.total || 0)} · Đang chờ duyệt:{" "}
                                {nfmt(propKpi.pending || 0)}
                            </p>
                        </div>
                    </div>
                    {propKpi.error && (
                        <div className="mb-2 text-sm text-red-600">
                            {propKpi.error}
                        </div>
                    )}
                    <div className="h-72 w-full">
                        <Bar
                            data={pendingSummaryChart.data}
                            options={pendingSummaryChart.options}
                        />
                    </div>
                </div>

                {/* Đơn hàng mới nhất -> Biểu đồ tròn */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7]">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Đơn hàng mới nhất
                            </h3>
                            <p className="text-sm text-gray-500">
                                {recentOrders.loading
                                    ? "Đang tải dữ liệu…"
                                    : `Số đơn gần đây: ${nfmt(
                                        recentOrdersSummary.totalCount
                                    )} · Tổng giá trị: ${vnd(
                                        recentOrdersSummary.totalAmount
                                    )}`}
                            </p>
                        </div>
                    </div>
                    {recentOrders.error && (
                        <div className="mb-2 text-sm text-red-600">
                            {recentOrders.error}
                        </div>
                    )}
                    <div className="h-72 w-full">
                        <Doughnut
                            data={recentOrdersStatusChart.data}
                            options={recentOrdersStatusChart.options}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
