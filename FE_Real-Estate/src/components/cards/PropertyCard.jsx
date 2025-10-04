// src/components/cards/PropertyCard.jsx
import {
  ShareAltOutlined,
  HeartOutlined,
  CameraOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

export default function PropertyCard({ item }) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* IMAGE WRAPPER (có padding để bo ảnh bên trong) */}
      <div className="relative p-3">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-[220px] object-cover rounded-[16px]"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = "https://picsum.photos/800/480")}
        />

        {/* quick actions top-right */}
        <div className="absolute right-6 top-6 flex gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow flex items-center justify-center"
            aria-label="Chia sẻ"
            title="Chia sẻ"
          >
            <ShareAltOutlined />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow flex items-center justify-center"
            aria-label="Yêu thích"
            title="Yêu thích"
          >
            <HeartOutlined />
          </button>
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
        <h3 className="text-[20px] font-extrabold text-gray-900 leading-snug line-clamp-3">
          {item.title}
        </h3>

        {/* Price */}
        <div className="mt-2">
          <span className="text-[#1f5fbf] font-bold text-[20px]">{item.price}</span>
          {item.pricePerM2 && (
            <span className="ml-2 text-gray-500 text-[13px]">
              ({item.pricePerM2})
            </span>
          )}
        </div>

        {/* Address 1 */}
        <div className="mt-2 text-gray-700 text-[14px] flex items-center gap-2">
          <EnvironmentOutlined className="text-[#1f5fbf]" />
          <span className="truncate">{item.addressShort}</span>
        </div>

        {/* Address 2 (mờ + ellipsis + (Cũ)) */}
        {item.addressFull && (
          <div className="mt-1 text-gray-500 text-[13px]">
            <span className="inline-block max-w-[92%] truncate align-middle">
              {item.addressFull}
            </span>{" "}
            <a href="#" className="text-[#1f5fbf]">( Cũ )</a>
          </div>
        )}

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
