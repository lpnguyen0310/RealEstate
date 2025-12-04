import React from "react";

export default function Sparkline({ points = [], color = "#3b82f6" }) {
    const width = 90;
    const height = 28;
    if (points.length === 0) return null;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const norm = points.map((v, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((v - min) / (max - min || 1)) * height;
        return `${x},${y}`;
    });
    return (
        <svg width={width} height={height}>
            <polyline
                points={norm.join(" ")}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}