// src/components/PropertyCard.jsx
import React, { useMemo } from "react";
import {
  ShareAltOutlined,
  HeartOutlined,
  HeartFilled,
  CameraOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { message, Modal } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { openLoginModal } from "@/store/uiSlice";
import { makeSelectIsSaved, toggleFavorite } from "@/store/favoriteSlice";
import { formatVNDShort } from "@/utils/money";

function stopLink(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function PropertyCard({ item = {} }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const imageUrl = item.image?.startsWith("/")
    ? `${origin}${item.image}`
    : item.image || item?.imageUrls?.[0] || "https://picsum.photos/800/480";

  const href = `/real-estate/${item.id}`;
  const thumb = imageUrl;

  // read saved state from slice (no custom hooks)
  const isSaved = useSelector((state) => makeSelectIsSaved(item.id)(state));

  const favPayload = useMemo(
    () => ({
      id: item.id,
      title: item.title,
      thumb,
      href,
      price: item.price ?? null,
      priceDisplay: item.priceDisplay || formatVNDShort(item.price),
      displayAddress: item.displayAddress || item.addressMain || "",
      pricePerM2: item.pricePerM2, // ví dụ: "210 tr/m²"
      area: item.area, // 35
      bed: item.bedrooms ?? item.bed, // 3
      bath: item.bathrooms ?? item.bath, // 4
      photos: item.photos ?? item?.imageUrls?.length ?? 0,
      postedAt: item.postedAtText ?? item.postedAt, // "Đăng hôm nay"
      listingType: item.listingType, // VIP/PREMIUM/NORMAL
    }),
    [
      item?.id,
      item?.title,
      item?.price,
      item?.priceDisplay,
      item?.displayAddress,
      item?.addressMain,
      item?.pricePerM2,
      item?.area,
      item?.bedrooms,
      item?.bed,
      item?.bathrooms,
      item?.bath,
      item?.photos,
      item?.imageUrls,
      item?.postedAtText,
      item?.postedAt,
      item?.listingType,
      thumb,
      href,
    ]
  );

  const handleToggle = (e) => {
    stopLink(e);

    if (!user) {
      Modal.confirm({
        title: "Bạn cần đăng nhập để thực hiện",
        content:
          "Vui lòng đăng nhập để lưu tin và đồng bộ trên nhiều thiết bị.",
        okText: "Đăng nhập",
        cancelText: "Quay lại",
        centered: true,
        onOk: () => dispatch(openLoginModal()),
      });
      return;
    }

    // Giao cho slice làm optimistic + rollback + gọi API
    dispatch(toggleFavorite({ id: item.id, payload: favPayload }))
      .unwrap()
      .catch(() => {
        message.error("Không thể lưu/bỏ lưu. Vui lòng thử lại!");
        Modal.error({
          title: "Có lỗi xảy ra",
          content: "Không thể lưu/bỏ lưu. Vui lòng thử lại!",
        });
      });
  };

  // Badge loại tin
  const type = item.listingType?.toUpperCase();
  let badge = null;
  let badgeClass = "";
  if (type === "PREMIUM") {
    badge = "PREMIUM";
    badgeClass = "bg-red-500";
  } else if (type === "VIP") {
    badge = "VIP";
    badgeClass = "bg-orange-500";
  }

  return (
    <a
      href={href}
      className="block no-underline rounded-[20px] border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
    >
      {/* IMAGE */}
      <div className="relative p-3">
        <div className="relative overflow-hidden rounded-[16px] ring-1 ring-black/5 bg-black/5">
          <img
            src={imageUrl}
            alt={item.title}
            className="block w-full h-[220px] object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) =>
              (e.currentTarget.src = "https://picsum.photos/800/480")
            }
          />

          {/* BADGE loại tin */}
          {badge && (
            <div
              className={`absolute left-4 top-4 px-3 py-1 text-white text-[12px] font-bold rounded-md shadow-lg ${badgeClass}`}
            >
              {badge}
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow flex items-center justify-center"
              onMouseDown={stopLink}
              onClick={stopLink}
              aria-label="Chia sẻ"
              title="Chia sẻ"
            >
              <ShareAltOutlined />
            </button>

            {/* ❤️ Toggle */}
            <button
              type="button"
              className={`w-9 h-9 rounded-full backdrop-blur-sm shadow flex items-center justify-center ${
                isSaved ? "bg-[#fff1ef]" : "bg-white/95 hover:bg-white"
              }`}
              onMouseDown={stopLink}
              onClick={handleToggle}
              aria-label={isSaved ? "Bỏ lưu" : "Lưu tin"}
              title={isSaved ? "Bỏ lưu" : "Lưu tin"}
            >
              {isSaved ? (
                <HeartFilled className="text-[#d6402c] text-[16px]" />
              ) : (
                <HeartOutlined className="text-[16px]" />
              )}
            </button>
          </div>

          {/* BADGE: thời gian */}
          {(item.postedAt || item.postedAtText) && (
            <div className="absolute left-4 bottom-4 flex items-center gap-1 bg-black/70 text-white text-[12px] px-3 py-1 rounded-full">
              <ClockCircleOutlined className="text-[12px]" />
              <span>{item.postedAtText ?? item.postedAt}</span>
            </div>
          )}

          {/* BADGE: số ảnh */}
          <div className="absolute right-4 bottom-4 flex items-center gap-1 bg-black/70 text-white text-[12px] px-2.5 py-1 rounded-full">
            <CameraOutlined className="text-[12px]" />
            <span>{item.photos ?? item?.imageUrls?.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-5 pb-5">
        <h3 className="text-[20px] font-extrabold text-gray-900 leading-snug line-clamp-3 min-h-[56px]">
          {item.title}
        </h3>

        <div className="mt-1">
          <span className="text-[#1f5fbf] font-bold text-[20px]">
            {item.priceDisplay || item.price || formatVNDShort(item.price)}
          </span>
          {item.pricePerM2 && (
            <span className="ml-2 text-gray-500 text-[13px]">
              ({item.pricePerM2})
            </span>
          )}
        </div>

        {(item.displayAddress || item.addressMain) && (
          <div className="mt-2 text-gray-700 text-[14px] flex items-center gap-2">
            <EnvironmentOutlined className="text-[#1f5fbf]" />
            <span className="truncate">
              {item.displayAddress || item.addressMain}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-6 text-gray-700 text-[14px]">
          {item.area ? (
            <div className="flex items-center gap-2">
              <span>🏠</span>
              <span>
                {item.area} <span className="text-[12px] align-top">m²</span>
              </span>
            </div>
          ) : null}
          {item.bedrooms ?? item.bed ? (
            <div className="flex items-center gap-2">
              <span>🛏</span>
              <span>{item.bedrooms ?? item.bed}</span>
            </div>
          ) : null}
          {item.bathrooms ?? item.bath ? (
            <div className="flex items-center gap-2">
              <span>🛁</span>
              <span>{item.bathrooms ?? item.bath}</span>
            </div>
          ) : null}
        </div>
      </div>
    </a>
  );
}
