// src/components/PropertyMiniCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PropertyMiniCard({ item }) {
    const nav = useNavigate();
    const {
        id,
        image,
        images = [],
        title,
        addressShort,
        price, // giá tính theo TRIỆU đồng (ví dụ: 1 = 1 triệu)
        pricePerM2,
        area,  // diện tích (m²)
        bed,
        bath,
        type,
    } = item || {};


    const fmt = new Intl.NumberFormat("vi-VN");
    const img = image || images[0];

    const formatPrice = (val, listingType) => {
        if (!val) return "—";

        // 1. Nếu API trả về String (nguyên gốc), dùng luôn
        if (typeof val === "string") return val;

        // 2. Nếu API trả về Number (đã bị mất chữ), ta đoán dựa vào Type
        if (typeof val === "number") {
            if (listingType === "rent") {
                return `${val} triệu`; // Thuê thì là triệu
            }
            return `${val} tỷ`;        // Mặc định bán là tỷ
        }
        return val;
    };

    // --- HÀM FORMAT GIÁ/M2 ---
    const formatM2 = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val; // Nếu là chuỗi thì trả về nguyên vẹn
        if (typeof val === "number") return `${val} tr/m²`; // Số thì thêm tr/m2
        return val;
    };

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
                    {/* GIÁ: Truyền cả price và type vào hàm xử lý */}
                    <div className="text-[13px] font-bold text-indigo-600">
                        {formatPrice(price, type)}
                    </div>

                    {/* GIÁ/M2 */}
                    <div className="text-[10px] text-zinc-400">
                        {formatM2(pricePerM2)}
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
