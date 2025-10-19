// src/components/cards/PropertyCard.jsx
import {
    ShareAltOutlined,
    HeartOutlined,
    CameraOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";

function stopLink(e) {
    e.preventDefault();
    e.stopPropagation();
}

export default function PropertyCard({ item }) {
    const origin = window.location.origin;
    const imageUrl = item.image?.startsWith('/') ? `${origin}${item.image}` : item.image;

    // === BƯỚC 1: XÁC ĐỊNH BADGE DỰA TRÊN `item.listingType` ===
    let badge = null;
    let badgeClass = "";
    
    // Chuyển sang chữ hoa để so sánh cho chắc chắn
    const type = item.listingType?.toUpperCase(); 

    if (type === "PREMIUM") {
        badge = "PREMIUM";
        badgeClass = "bg-red-500"; // Màu đỏ cho Premium
    } else if (type === "VIP") {
        badge = "VIP";
        badgeClass = "bg-orange-500"; // Màu cam cho VIP
    }
    // Nếu là "NORMAL", badge sẽ là null và không hiển thị

    return (
        <div className="rounded-[20px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
            {/* IMAGE WRAPPER */}
            <div className="relative p-3">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-[220px] object-cover rounded-[16px]"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "https://picsum.photos/800/480")}
                />

                {/* === BƯỚC 2: THÊM JSX ĐỂ HIỂN THỊ BADGE === */}
                {badge && ( // Chỉ render nếu `badge` có giá trị (không phải là NORMAL)
                    <div
                        className={`absolute left-6 top-6 px-3 py-1 text-white text-[12px] font-bold rounded-md shadow-lg ${badgeClass}`}
                    >
                        {badge}
                    </div>
                )}

                {/* quick actions top-right */}
                <div className="absolute right-6 top-6 flex gap-2">
                    {/* ... (buttons share, like) ... */}
                </div>

                {/* badge: thời gian (trái dưới) */}
                <div className="absolute left-6 bottom-6 flex items-center gap-1 bg-black/70 text-white text-[12px] px-3 py-1 rounded-full">
                    <ClockCircleOutlined className="text-[12px]" />
                    <span>{item.postedAt}</span>
                </div>

                {/* badge: số ảnh (phải dưới) */}
                <div className="absolute right-6 bottom-6 flex items-center gap-1 bg-black/70 text-white text-[12px] px-2.5 py-1 rounded-full">
                    <CameraOutlined className="text-[12px]" />
                    <span>{item.photos}</span>
                </div>
            </div>

            {/* BODY */}
            <div className="px-5 pb-5">
                {/* Title */}
                <h3 className="text-[20px] font-extrabold text-gray-900 leading-snug line-clamp-3 min-h-[84px]">
                    {item.title}
                </h3>

                {/* Price */}
                <div className="mt-2">
                    <span className="text-[#1f5fbf] font-bold text-[20px]">{item.price}</span>
                    {item.pricePerM2 && (
                        <span className="ml-2 text-gray-500 text-[13px]">({item.pricePerM2})</span>
                    )}
                </div>

                {/* Address */}
                <div className="mt-2 text-gray-700 text-[14px] flex items-center gap-2">
                    <EnvironmentOutlined className="text-[#1f5fbf]" />
                    <span className="truncate">{item.addressMain}</span>
                </div>

                {/* Features */}
                <div className="mt-3 flex items-center gap-6 text-gray-700 text-[14px]">
                  <div className="flex items-center gap-2">
                    <span>🏠</span>
                    <span>
                      {item.area} <span className="text-[12px] align-top">m²</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🛏</span>
                    <span>{item.bed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🛁</span>
                    <span>{item.bath}</span>
                  </div>
                </div>
            </div>
        </div>
    );
}