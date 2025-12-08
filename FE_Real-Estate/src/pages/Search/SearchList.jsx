// List dọc: ảnh lớn bên trái + thông tin bên phải (KHÔNG VIP)
import React, { useEffect, useMemo, useRef, useState } from "react";
import zaloIcon from "../../assets/zalo.png";

/* ================= Icons ================= */
const Icon = {
  Area: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14H3V5zm2 2v10h14V7H5z" />
    </svg>
  ),
  Bed: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M21 10V7a2 2 0 0 0-2-2H5C3.9 5 3 5.9 3 7v3h18zM3 12h18v7h-2v-2H5v2H3v-7z" />
    </svg>
  ),
  Bath: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M7 3a3 3 0 0 0-3 3v6h16v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h18v-2H4V6a3 3 0 0 1 3-3z" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}>
      <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm1 5h-2v6l5 3 .9-1.5-3.9-2.3V7z" />
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}>
      <path d="M9 3l-1.8 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10z" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1.2 1.2 0 011.2-.3c1.3.4 2.7.6 4.1.6.7 0 1.3.6 1.3 1.3v3.4c0 .7-.6 1.3-1.3 1.3C9.7 21.8 2.2 14.3 2.2 4.3 2.2 3.6 2.8 3 3.5 3H7c.7 0 1.3.6 1.3 1.3 0 1.4.2 2.8.6 4.1.1.4 0 .9-.3 1.2l-2 2.2z" />
    </svg>
  ),
};

/* ============== Listing badge config ============== */
const LISTING_BADGE = {
  PREMIUM: {
    label: "PREMIUM",
    className:
      "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]",
  },
  VIP: {
    label: "VIP",
    className:
      "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]",
  },
  NORMAL: null, // tin thường không hiển thị ribbon
};

/* ============== Skeleton helpers ============== */
function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

function PropertyListItemSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* LEFT */}
        <div className="w-full sm:w-[320px] shrink-0">
          <SkeletonBlock className="h-[220px] w-full rounded-xl" />
          <div className="mt-2 flex items-center justify-between">
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <SkeletonBlock className="h-[70px]" />
            <SkeletonBlock className="h-[70px]" />
            <SkeletonBlock className="h-[70px]" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 min-w-0">
          <SkeletonBlock className="h-6 w-3/4" />
          <div className="mt-2 flex items-center gap-2">
            <SkeletonBlock className="h-4 w-5" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="mt-2 flex gap-4">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-12" />
            <SkeletonBlock className="h-4 w-12" />
          </div>
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
          <SkeletonBlock className="mt-1 h-4 w-2/3" />

          <div className="mt-3 flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <SkeletonBlock className="h-8 w-8 rounded-full" />
              <div>
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="mt-1 h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-9 w-28 rounded-full" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ============== Real item ============== */
function PropertyListItem({ data, onClick }) {
  const images = data.images?.length ? data.images : data.image ? [data.image] : [];
  const thumbs = images.slice(1, 4);
  const photosCount = data.photosCount ?? images.length ?? data.photos ?? 0;

  // Lấy loại tin từ BE, ví dụ: PREMIUM / VIP / NORMAL
  const listingType = data.listingType || data.listingLevel || "NORMAL";
  const badge = LISTING_BADGE[listingType];

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white/80 shadow-sm hover:shadow-xl hover:border-blue-500/60 transition-all duration-200 overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* LEFT: ảnh + thumbnails + chips */}
        <div className="w-full sm:w-[320px] shrink-0">
          <div className="relative rounded-xl overflow-hidden bg-slate-100">
            {/* RIBBON PREMIUM / VIP */}
            {badge && (
              <div
                className={`absolute left-0 top-3 inline-flex items-center gap-1 px-3 py-1 rounded-r-full text-[11px] font-semibold text-white backdrop-blur-sm ${badge.className}`}
              >
                <span className="text-base leading-none">⚡</span>
                <span>{badge.label}</span>
              </div>
            )}

            {/* Gradient overlay bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

            {images[0] ? (
              <img
                src={images[0]}
                alt={data.title}
                className="h-[220px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="h-[220px] w-full bg-slate-100" />
            )}

            {/* Info overlay bottom-left */}
            {(data.postedAt || photosCount) && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-100">
                {data.postedAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
                    <Icon.Clock /> <span className="truncate">{data.postedAt}</span>
                  </span>
                )}
                {photosCount ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
                    <Icon.Camera /> {photosCount} ảnh
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {thumbs.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg bg-slate-100"
                >
                  <img
                    src={src}
                    className="h-[70px] w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: nội dung */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-[18px] sm:text-[20px] font-semibold leading-snug line-clamp-2 cursor-pointer text-slate-900 hover:text-blue-600 transition-colors"
              title={data.title}
              onClick={onClick}
            >
              {data.title}
            </h3>
            <div className="text-right shrink-0">
              <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent font-extrabold text-lg">
                {data.price || "Thỏa thuận"}
              </div>
              {data.pricePerM2 && (
                <div className="mt-0.5 text-xs text-slate-500">
                  ({data.pricePerM2})
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mt-2 flex items-center gap-2 text-slate-600">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Icon.Pin />
            </span>
            <span className="text-sm truncate" title={data.addressMain}>
              {data.addressMain}
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-slate-700">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Icon.Area />
              <span>{data.area ?? "—"} m²</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Icon.Bed />
              <span>{data.bed ?? "—"} PN</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Icon.Bath />
              <span>{data.bath ?? "—"} WC</span>
            </span>
          </div>

          {/* Description */}
          {data.description && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {data.description}
            </p>
          )}

          {/* Agent + actions */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 px-3 py-2.5 border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              {data.agent?.avatar ? (
                <img
                  src={data.agent.avatar}
                  alt={data.agent.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-100 ring-2 ring-slate-200 flex items-center justify-center font-semibold text-slate-700">
                  {(data.agent?.name || "M")?.charAt(0)}
                </div>
              )}
              <div className="leading-tight min-w-0">
                <div
                  className="text-sm font-medium truncate max-w-[180px] text-slate-900"
                  title={data.agent?.name || "Môi giới"}
                >
                  {data.agent?.name || "Môi giới"}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {data.agent?.role || "Môi giới"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {data.agent?.phone && (
                <a
                  href={`tel:${String(data.agent.phone).replace(/\s/g, "")}`}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500 px-3 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all"
                >
                  <Icon.Phone />
                  <span>{maskPhone(data.agent.phone)}</span>
                </a>
              )}

              <a
                href={data.agent?.zaloUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                title="Zalo"
              >
                <img
                  src={zaloIcon}
                  alt="Zalo"
                  className="w-[22px] h-[22px] object-contain"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SearchList({
  items,
  loading,
  minDelayMs = 1200,
  skeletonCount = 6,
}) {
  const [minDelayDone, setMinDelayDone] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setMinDelayDone(true), minDelayMs);
    return () => clearTimeout(timerRef.current);
  }, [minDelayMs]);

  const isLoading = loading ?? items == null;
  const hasData = Array.isArray(items) && items.length > 0;

  const showSkeleton = isLoading || !minDelayDone;

  const listToRender = useMemo(() => {
    if (showSkeleton) return Array.from({ length: skeletonCount });
    if (hasData) return items;
    return [];
  }, [showSkeleton, hasData, items, skeletonCount]);

  if (!showSkeleton && !hasData) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-500">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <span className="text-xl">🔍</span>
        </div>
        <p className="text-sm font-medium">Không có kết quả phù hợp.</p>
        <p className="mt-1 text-xs text-slate-400">
          Thử thay đổi bộ lọc hoặc khu vực tìm kiếm nhé.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {listToRender.map((p, idx) =>
        showSkeleton ? (
          <PropertyListItemSkeleton key={`sk-${idx}`} />
        ) : (
          <PropertyListItem
            key={p.id}
            data={p}
            onClick={() => window.location.assign(`/real-estate/${p.id}`)}
          />
        )
      )}
    </div>
  );
}

/* ============== utils ============== */
function maskPhone(phone) {
  if (!phone) return "";
  const p = String(phone).replace(/\s/g, "");
  if (p.length <= 7) return p;
  return p.slice(0, 7) + "***";
}
