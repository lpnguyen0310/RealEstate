// src/components/dashboard/dashboardoverview/PostsChartApex.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Chart from "react-apexcharts";

// ====== Data sources ======
const selectMyList = (s) => s.property?.myList ?? [];

// ====== Time utils ======
const MS_DAY = 24 * 60 * 60 * 1000;

function parseToDate(x) {
    if (!x) return null;
    try {
        if (typeof x === "number") return new Date(x);
        if (typeof x === "string") {
            let s = x.replace(" ", "T");
            if (!/Z|[+-]\d{2}:\d{2}$/.test(s)) s += "Z";
            const t = Date.parse(s);
            return Number.isNaN(t) ? null : new Date(t);
        }
        if (typeof x === "object" && "year" in x && "month" in x && "day" in x) {
            const { year, month, day, hour = 0, minute = 0, second = 0, nano = 0 } = x;
            return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1e6));
        }
        return null;
    } catch {
        return null;
    }
}

function formatDay(d) {
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); // dd/MM
}

function getISOWeek(d) {
    // ISO week number
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((date - firstThursday) / MS_DAY - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return { week, year: date.getUTCFullYear() };
}

function formatWeekLabel(d) {
    const { week, year } = getISOWeek(d);
    return `W${String(week).padStart(2, "0")} ${year}`;
}

function formatMonth(d) {
    return d.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" }); // MM/yyyy
}

// Tạo 16 bucket trống theo mode
function buildEmptyBuckets(mode, n = 16) {
    const now = new Date();
    const buckets = [];
    if (mode === "day") {
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            d.setDate(d.getDate() - i);
            buckets.push({ key: d.toDateString(), label: formatDay(d) });
        }
    } else if (mode === "week") {
        // Lùi theo tuần ISO
        const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(anchor);
            d.setDate(d.getDate() - i * 7);
            buckets.push({ key: formatWeekLabel(d), label: formatWeekLabel(d) });
        }
    } else {
        // month
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            d.setMonth(d.getMonth() - i);
            buckets.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: formatMonth(d) });
        }
    }
    return buckets;
}

function keyByMode(d, mode) {
    if (!d) return null;
    if (mode === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    if (mode === "week") return formatWeekLabel(d);
    return `${d.getFullYear()}-${d.getMonth() + 1}`; // month
}

export default function PostsChartApex({ data = [], defaultMode = "day" }) {
    const myList = useSelector(selectMyList);
    const [mode, setMode] = useState(defaultMode);
    const [showSell, setShowSell] = useState(true);
    const [showRent, setShowRent] = useState(true);

    // ====== Build rows: [{label, sell, rent}, ...] ======
    const rows = useMemo(() => {
        // Nếu truyền data thủ công -> dùng luôn
        if (Array.isArray(data) && data.length) return data;

        // Tự build từ myList
        const buckets = buildEmptyBuckets(mode, 16);
        const map = new Map(buckets.map(b => [b.key, { label: b.label, sell: 0, rent: 0 }]));

        for (const p of myList) {
            const t = parseToDate(p?.postedAt);
            if (!t) continue;

            const k = keyByMode(t, mode);
            if (!k || !map.has(k)) continue;

            // Xác định loại
            // Nếu bạn có p.propertyType === "sell"/"rent" thì dùng trực tiếp:
            // const isSell = p?.propertyType === "sell";
            const isSell = String(p?.installmentText || "").toLowerCase().includes("bán")
                || p?.propertyType === "sell";
            const isRent = String(p?.installmentText || "").toLowerCase().includes("thuê")
                || p?.propertyType === "rent";

            const bucket = map.get(k);
            if (isSell) bucket.sell += 1;
            else if (isRent) bucket.rent += 1;
        }

        return Array.from(map.values());
    }, [data, myList, mode]);

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
                                className={`px-3 h-9 text-[13px] ${mode === v ? "bg-white" : "bg-transparent"
                                    }`}
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
