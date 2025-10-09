import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";

/**
 * Props:
 *  data: [{ label: "10/09", sell: 2, rent: 1 }, ...]
 *  defaultMode: "day" | "week" | "month"
 */
export default function PostsChartApex({ data = [], defaultMode = "day" }) {
    const [mode, setMode] = useState(defaultMode);
    const [showSell, setShowSell] = useState(true);
    const [showRent, setShowRent] = useState(true);

    // demo data nếu không truyền vào
    const rows = useMemo(() => {
        if (data.length) return data;
        const labels = [
            "10/09", "12/09", "14/09", "16/09", "18/09", "20/09", "22/09",
            "24/09", "26/09", "28/09", "30/09", "02/10", "04/10", "06/10", "08/10", "10/10"
        ];
        return labels.map((label, i) => ({
            label,
            sell: i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
            rent: i % 4 === 0 ? 1 : 0,
        }));
    }, [data]);

    const categories = rows.map(r => r.label);
    const sell = rows.map(r => r.sell);
    const rent = rows.map(r => r.rent);

    const series = [
        ...(showSell ? [{ name: "Tin bán", data: sell }] : []),
        ...(showRent ? [{ name: "Tin thuê", data: rent }] : []),
    ];

    const options = {
        chart: {
            type: "area",
            toolbar: { show: false },
            foreColor: "#516072",
            animations: { enabled: true, easing: "easeinout", speed: 500 },
            dropShadow: { enabled: false },
        },
        colors: ["#1c396a", "#ff8c42"], // bán, thuê
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 0.9,
                opacityFrom: 0.35,
                opacityTo: 0.02,
                stops: [0, 90, 100],
            },
        },
        grid: {
            borderColor: "#e6eefb",
            strokeDashArray: 4,
            padding: { left: 12, right: 12 },
        },
        markers: { size: 0, hover: { size: 6 } },
        legend: {
            show: true,
            fontSize: "12px",
            markers: { radius: 12 },
            itemMargin: { horizontal: 12 },
        },
        tooltip: {
            theme: "light",
            y: { formatter: (v) => `${v}` },
        },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { rotate: -35, style: { fontSize: "12px" } },
        },
        yaxis: {
            min: 0,
            forceNiceScale: true,
            decimalsInFloat: 0,
            labels: { style: { fontSize: "12px" } },
        },
        responsive: [
            { breakpoint: 768, options: { xaxis: { labels: { rotate: -25 } } } },
        ],
    };

    return (
        <div className="rounded-2xl border border-[#e8edf6] shadow-[0_8px_24px_rgba(13,47,97,0.06)] bg-white">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <h3 className="text-[16px] font-bold text-[#1c396a]">Biểu đồ tin đăng</h3>

                <div className="flex items-center gap-2">
                    {/* Granularity */}
                    <div className="bg-[#f5f7fb] border border-[#e8edf6] rounded-xl overflow-hidden">
                        {["day", "week", "month"].map(v => (
                            <button
                                key={v}
                                onClick={() => setMode(v)}
                                className={`px-3 h-9 text-[13px] ${mode === v ? "bg-white" : "bg-transparent"} `}
                            >
                                {v === "day" ? "Ngày" : v === "week" ? "Tuần" : "Tháng"}
                            </button>
                        ))}
                    </div>

                    {/* Toggles */}
                    <button
                        onClick={() => setShowSell(s => !s)}
                        className={`h-9 px-3 rounded-lg text-[13px] border transition
                        ${showSell ? "bg-[#eef3ff] border-[#cdd9ff] text-[#1c396a]" : "bg-white border-[#e8edf6] text-gray-500"}`}
                    >
                        Tin bán
                    </button>
                    <button
                        onClick={() => setShowRent(s => !s)}
                        className={`h-9 px-3 rounded-lg text-[13px] border transition
                        ${showRent ? "bg-[#fff1e8] border-[#ffd6b8] text-[#c26a00]" : "bg-white border-[#e8edf6] text-gray-500"}`}
                    >
                        Tin thuê
                    </button>
                </div>
            </div>

            {/* Chart area */}
            <div className="bg-[#f3f7ff] rounded-b-2xl p-3">
                <Chart options={options} series={series} type="area" height={360} />
            </div>
        </div>
    );
}
