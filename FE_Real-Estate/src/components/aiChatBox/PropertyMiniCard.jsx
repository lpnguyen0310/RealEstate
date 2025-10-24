import React from "react";
import { useNavigate } from "react-router-dom";

export default function PropertyMiniCard({ item }) {
    const nav = useNavigate();
    const {
        id, image, images = [], title, addressShort, price, pricePerM2,
        area, bed, bath
    } = item || {};

    const fmt = new Intl.NumberFormat("vi-VN");
    const img = image || images[0];

    return (
        <div
            role="button"
            onClick={() => nav(`/real-estate/${id}`)}
            className="w-[260px] shrink-0 rounded-xl overflow-hidden border border-black/10 bg-white hover:shadow-md transition cursor-pointer"
            title={title}
        >
            {/* Image */}
            <div className="relative h-36 bg-zinc-100">
                {img ? (
                    <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-zinc-400">
                        No image
                    </div>
                )}

                {area ? (
                    <div className="absolute bottom-2 left-2 text-[11px] px-1.5 py-0.5 rounded-md bg-black/70 text-white">
                        {area} m²
                    </div>
                ) : null}
            </div>

            {/* Body */}
            <div className="p-2.5 space-y-1">
                <div className="text-[13px] font-semibold line-clamp-2">{title}</div>
                <div className="text-[11px] text-zinc-500 line-clamp-1">{addressShort}</div>

                <div className="flex items-center justify-between pt-1">
                    <div className="text-[13px] font-bold text-indigo-600">
                        {price != null ? `${fmt.format(price)} ₫` : "—"}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                        {pricePerM2 != null ? `${fmt.format(pricePerM2)} ₫/m²` : ""}
                    </div>
                </div>

                <div className="text-[11px] text-zinc-600 flex items-center gap-2">
                    {bed != null ? <span>🛏 {bed}</span> : null}
                    {bath != null ? <span>🛁 {bath}</span> : null}
                </div>
            </div>
        </div>
    );
}
