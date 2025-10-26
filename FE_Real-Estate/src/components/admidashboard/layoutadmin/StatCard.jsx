import React from "react";
import Sparkline from "./Sparkline";

export default function StatCard({
    title,
    value,
    hint,
    trend,
    spark = [],
    iconBg,
    icon,
    trendColor = "text-green-600",
    lineColor = "#3b82f6",
    gradientFrom = "from-blue-50",
    gradientTo = "to-white",
}) {
    return (
        <div
            className={`relative p-6 rounded-2xl shadow-md border border-[#e5ebf5] flex flex-col justify-between
      bg-gradient-to-br ${gradientFrom} ${gradientTo} hover:shadow-lg transition-all duration-200`}
        >
            <div className="absolute right-4 top-4">
                <div className={`${iconBg} rounded-full p-3 shadow-inner`}>{icon}</div>
            </div>

            <div>
                <p className="text-[15px] font-semibold text-[#1c396a] mb-2 tracking-wide">
                    {title}
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-tight">{value}</p>

                <div className="mt-3">
                    <Sparkline points={spark} color={lineColor} />
                </div>

                {hint && (
                    <p className={`text-xs flex items-center mt-2 font-medium ${trendColor}`}>
                        {trend === "down" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        )}
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}
