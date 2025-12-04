import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import siteReviewApi from "@/api/siteReviewApi"; // Ensure this import is correct
const nfmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

function ReviewAnalyticsCard() {
    const [reviewData, setReviewData] = useState({
        total: 0,
        average: 0,
        distribution: [
            { star: 5, count: 0, color: "#22c55e" },
            { star: 4, count: 0, color: "#3b82f6" },
            { star: 3, count: 0, color: "#eab308" },
            { star: 2, count: 0, color: "#f97316" },
            { star: 1, count: 0, color: "#ef4444" },
        ],
    });

    // Fetch review summary data
    useEffect(() => {
        async function fetchData() {
            try {
                const response = await siteReviewApi.getSummary(5); // Adjust the limit if needed
                const data = response.data;

                // Update the state with the fetched data
                setReviewData({
                    total: data.totalReviews,
                    average: data.averageRating,
                    distribution: [
                        { star: 5, count: data.reviews.filter((r) => r.rating === 5).length, color: "#22c55e" },
                        { star: 4, count: data.reviews.filter((r) => r.rating === 4).length, color: "#3b82f6" },
                        { star: 3, count: data.reviews.filter((r) => r.rating === 3).length, color: "#eab308" },
                        { star: 2, count: data.reviews.filter((r) => r.rating === 2).length, color: "#f97316" },
                        { star: 1, count: data.reviews.filter((r) => r.rating === 1).length, color: "#ef4444" },
                    ],
                });
            } catch (error) {
                console.error("Error fetching review data", error);
            }
        }

        fetchData();
    }, []);

    const chartData = {
        labels: ["5 Sao", "4 Sao", "3 Sao", "2 Sao", "1 Sao"],
        datasets: [
            {
                data: reviewData.distribution.map((d) => d.count),
                backgroundColor: reviewData.distribution.map((d) => d.color),
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        cutout: "75%",
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || "";
                        const value = context.raw || 0;
                        const total = context.chart._metasets[context.datasetIndex].total;
                        const percentage = Math.round((value / total) * 100) + "%";
                        return `${label}: ${value} (${percentage})`;
                    },
                },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e9eef7] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Đánh giá hệ thống</h3>
               
            </div>

            {/* Top Stats */}
            <div className="flex items-end gap-2 mb-6">
                <h2 className="text-4xl font-bold text-gray-900">{reviewData.average}</h2>
                <div className="mb-1.5">
                    <div className="flex text-yellow-400 text-sm">
                        {"★".repeat(Math.floor(reviewData.average))}
                        <span className="text-gray-300">
                            {"★".repeat(5 - Math.floor(reviewData.average))}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        dựa trên {nfmt(reviewData.total)} đánh giá
                    </p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="relative h-48 w-full mb-6">
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm text-gray-400 font-medium">Tổng</span>
                    <span className="text-xl font-bold text-gray-800">
                        {nfmt(reviewData.total)}
                    </span>
                </div>
            </div>

            {/* Custom Legend / List */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-3">
                    {reviewData.distribution.map((item) => (
                        <div key={item.star} className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-gray-600 w-8 flex shrink-0 items-center gap-1">
                                {item.star}
                                <span className="text-yellow-400 text-[10px]">★</span>
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(item.count / reviewData.total) * 100}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
                                {item.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ReviewAnalyticsCard;
