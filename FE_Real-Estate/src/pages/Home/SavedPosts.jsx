// src/pages/SavedPosts.jsx
import React, { useMemo } from "react";
import { Empty, Tooltip, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartFilled,
  HeartOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { selectList, toggleFavorite } from "@/store/favoriteSlice";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400&auto=format&fit=crop";

export default function SavedPosts() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  // Lấy trực tiếp từ Redux (đã kèm savedAgo trong selector)
  const list = useSelector(selectList);
  // Nếu bạn có trạng thái hydrate trong slice thì lấy, còn không để false
  const loading = useSelector((s) => s.favorite?.isHydrating) || false;

  const total = useMemo(() => list.length, [list]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <SkeletonList />
      </div>
    );
  }

  if (!total) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có tin nào được lưu"
        />
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 mt-6 rounded-xl px-5 py-3 bg-black text-white hover:bg-black/90 transition"
        >
          Khám phá tin đăng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tin đã lưu</h1>
          <p className="text-sm text-gray-500">{total} tin</p>
        </div>
        <Link
          to="/listings"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200 transition"
        >
          Tiếp tục xem
        </Link>
      </div>

      {/* One-row cards */}
      <div className="space-y-5">
        {list.map((p) => (
          <RowCard
            key={p.id}
            post={p}
            onOpen={() => p.href && nav(p.href)}
            onRemove={() => {
              // Giao cho thunk trong slice: optimistic + API + rollback nếu lỗi
              dispatch(toggleFavorite({ id: p.id, payload: { id: p.id } }))
                .unwrap()
                .then(() => message.success("Đã bỏ lưu tin"))
                .catch(() => message.error("Không thể bỏ lưu. Thử lại sau."));
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ================= Row Card ================= */
function RowCard({ post, onRemove, onOpen }) {
  const {
    href,
    thumb,
    title,
    savedAgo,
    price,
    priceDisplay, // "7,35 tỷ" | "500 triệu" | "22.000 đ"
    pricePerM2, // "210 tr/m²"
    area,
    bed,
    bath,
    photos,
    postedAt,
    listingType, // VIP | PREMIUM | NORMAL
    displayAddress,
    address,
  } = post || {};

  const _addr = displayAddress || address || "";
  const _photos = photos ?? post?.imageUrls?.length ?? null;

  const badge = (listingType || "").toUpperCase();
  const badgeColor =
    badge === "VIP"
      ? "bg-orange-500"
      : badge === "PREMIUM"
        ? "bg-red-500"
        : badge
          ? "bg-gray-700"
          : "";

  return (
    <div
      className="group relative w-full rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
      role="button"
      onClick={(e) => {
        e.preventDefault();
        onOpen?.();
      }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative sm:w-[320px]">
          <div className="relative h-[200px] sm:h-[220px]">
            <img
              src={thumb || FALLBACK_IMG}
              alt={title || ""}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
            {_photos != null && (
              <div className="absolute right-2 bottom-2 flex items-center gap-1 bg-white/90 backdrop-blur text-gray-900 text-[12px] px-2.5 py-1 rounded-full shadow">
                <CameraOutlined />
                <span>{_photos}</span>
              </div>
            )}
            {badge && (
              <div
                className={`absolute left-2 top-2 px-2.5 py-1 text-white text-[12px] font-bold rounded-md shadow ${badgeColor}`}
              >
                {badge}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          <h3 className="text-[16px] sm:text-[18px] font-semibold text-gray-900 leading-snug line-clamp-2">
            {title}
          </h3>

          {/* Price + chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-[#d6402c] font-extrabold text-[18px] sm:text-[20px]">
              {priceDisplay ?? formatVNDShort(price)}
            </div>

            {area != null && (
              <MetaChip>
                {area}
                <span className="text-[11px] ml-1">m²</span>
              </MetaChip>
            )}
            {pricePerM2 && <MetaChip>{pricePerM2}</MetaChip>}
            {bed != null && <MetaChip>🛏 {bed}</MetaChip>}
            {bath != null && <MetaChip>🛁 {bath}</MetaChip>}
          </div>

          {_addr && (
            <div className="mt-2 text-gray-700 text-[14px] flex items-start gap-2">
              <EnvironmentOutlined className="text-[#1f5fbf] relative top-[2px]" />
              <span className="truncate sm:whitespace-normal" title={_addr}>
                {_addr}
              </span>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
            {postedAt && (
              <div className="flex items-center gap-1">
                <ClockCircleOutlined />
                <span>{postedAt}</span>
              </div>
            )}
            {savedAgo && (
              <div className="flex items-center gap-1">
                <HeartFilled className="text-[#d6402c]" />
                <span>Đã lưu {savedAgo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col items-end justify-between gap-2 px-4 py-4 sm:p-4">
          <Tooltip title="Bỏ lưu">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-[#fff1ef] flex items-center justify-center shadow-sm transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.();
              }}
              aria-label="Bỏ lưu"
            >
              <HeartOutlined className="text-[16px] text-[#d6402c]" />
            </button>
          </Tooltip>

          <Link
            to={href || "#"}
            onClick={(e) => {
              e.stopPropagation();
              if (!href) e.preventDefault();
            }}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-medium hover:bg-gray-50"
          >
            Xem chi tiết <span className="text-[16px] leading-none">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ================= Small helpers ================= */
function MetaChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-[12px] px-2.5 py-1">
      {children}
    </span>
  );
}

// Dự phòng nếu price là number/chuỗi số
function formatVNDShort(v) {
  if (v == null || v === "") return "Liên hệ";
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return "Liên hệ";
    if (/[^\d,.\s]/.test(s)) return s; // đã có chữ: triệu/tỷ/đ/Thoả thuận...
    v = Number(s.replace(/\./g, "").replace(",", "."));
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return "Liên hệ";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return trimZeros((n / 1_000_000_000).toFixed(2)) + " tỷ";
  if (abs >= 1_000_000) return trimZeros((n / 1_000_000).toFixed(0)) + " triệu";
  return n.toLocaleString("vi-VN") + " đ";
}
function trimZeros(s) {
  return s.replace(/\.?0+$/, "");
}

/* ================= Skeleton ================= */
function SkeletonList() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse"
        >
          <div className="w-full sm:w-[320px] h-[220px] bg-gray-100" />
          <div className="flex-1 py-4 pr-4">
            <div className="h-5 w-2/3 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-1/3 bg-gray-100 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
            <div className="h-4 w-1/4 bg-gray-100 rounded mb-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
