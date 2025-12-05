// src/components/admidashboard/dashboard/overview/RecentTransactionsCard.jsx
import React, { useMemo } from "react";
import { PolarArea } from "react-chartjs-2";
import "chart.js/auto";
import { nfmt, vnd } from "./dashboardUtils";

// Sinh màu HSL tự động theo số lượng gói
function generateColor(index, total) {
    if (!total || total <= 0) {
        return "hsl(210, 70%, 55%)";
    }
    const hue = Math.round((360 / total) * index); // chia đều 0–360°
    return `hsl(${hue}, 70%, 55%)`;
}

export default function RecentTransactionsCard({ items = [], loading = false }) {
    // Chuẩn hóa dữ liệu từ PackageSalesStatsDTO
    const normalized = useMemo(() => {
        if (!Array.isArray(items)) return [];

        return items.map((p, idx) => {
            const name = p.name || p.code || `Gói #${idx + 1}`;
            const code = p.code || "";

            const qty = Number(p.ordersCount ?? 0);      // số order item
            const revenue = Number(p.totalAmount ?? 0);  // tổng tiền VND

            return { name, code, qty, revenue };
        });
    }, [items]);

    // Top 5 gói theo lượt mua
    const topPackages = useMemo(
        () => [...normalized].sort((a, b) => b.qty - a.qty).slice(0, 5),
        [normalized]
    );

    // Tổng quan
    const totals = useMemo(() => {
        const totalQty = normalized.reduce((s, p) => s + (p.qty || 0), 0);
        const totalRevenue = normalized.reduce(
            (s, p) => s + (p.revenue || 0),
            0
        );
        const totalPackages = normalized.length;
        return { totalQty, totalRevenue, totalPackages };
    }, [normalized]);

    const chartConfig = useMemo(() => {
        // Không có dữ liệu
        if (!topPackages.length) {
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
                    scales: {
                        r: {
                            beginAtZero: true,
                            ticks: {
                                display: false, // không hiển thị số
                            },
                            grid: {
                                display: true,  // vẫn giữ vòng tròn
                                color: "rgba(148,163,184,0.2)",
                            },
                            angleLines: {
                                display: true,  // vẫn giữ các đường chia
                                color: "rgba(148,163,184,0.25)",
                            },
                        },
                    },
                },
            };
        }

        const labels = topPackages.map((p) =>
            p.code ? `${p.name} (${p.code})` : p.name
        );
        const qtyData = topPackages.map((p) => p.qty || 0);

        // Sinh màu tự động theo số gói trong top
        const bgColors = qtyData.map((_, i) =>
            generateColor(i, qtyData.length)
        );
        const hoverColors = bgColors.map((c) =>
            c.replace("55%)", "50%)") // hơi tối lại khi hover
        );

        return {
            data: {
                labels,
                datasets: [
                    {
                        data: qtyData,
                        backgroundColor: bgColors,
                        hoverBackgroundColor: hoverColors,
                        borderWidth: 2,
                        borderColor: "#ffffff",
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
                                const idx = ctx.dataIndex;
                                const pkg = topPackages[idx];
                                const qty = pkg?.qty || 0;
                                const revenue = pkg?.revenue || 0;
                                return [
                                    `${ctx.label}`,
                                    `Lượt mua: ${qty.toLocaleString("vi-VN")} lượt`,
                                    `Doanh thu: ${vnd(revenue)}`,
                                ];
                            },
                        },
                    },
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            display: false, // Ẩn số 0,1,2,3...
                        },
                        grid: {
                            display: true,
                            color: "rgba(148,163,184,0.2)",
                        },
                        angleLines: {
                            display: true,
                            color: "rgba(148,163,184,0.25)",
                        },
                    },
                },
            },
        };
    }, [topPackages]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Hiệu suất gói tin đã bán
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Top 5 gói theo lượt mua · Diện tích mỗi “miếng” thể hiện số lượt mua.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                    <span>
                        Số gói:{" "}
                        <span className="font-semibold text-gray-800">
                            {nfmt(totals.totalPackages || 0)}
                        </span>
                    </span>
                    <span>
                        Tổng lượt mua:{" "}
                        <span className="font-semibold text-gray-800">
                            {nfmt(totals.totalQty || 0)}
                        </span>
                    </span>
                    <span>
                        Tổng doanh thu:{" "}
                        <span className="font-semibold text-emerald-600">
                            {vnd(totals.totalRevenue || 0)}
                        </span>
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                        Đang tải thống kê gói tin…
                    </div>
                ) : (
                    <PolarArea
                        data={chartConfig.data}
                        options={chartConfig.options}
                    />
                )}
            </div>

            {!loading && !topPackages.length && (
                <p className="mt-3 text-center text-xs text-gray-500">
                    Chưa có dữ liệu giao dịch cho gói tin.
                </p>
            )}
        </div>
    );
}
