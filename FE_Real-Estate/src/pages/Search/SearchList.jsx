// List dọc: ảnh lớn bên trái + thông tin bên phải (KHÔNG VIP)
import React from "react";
import zaloIcon from "../../assets/zalo.png";

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
      <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm1 5h-2v6l5 3 .9-1.5-3.9-2.3V7z"/>
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}>
      <path d="M9 3l-1.8 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10z"/>
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1.2 1.2 0 011.2-.3c1.3.4 2.7.6 4.1.6.7 0 1.3.6 1.3 1.3v3.4c0 .7-.6 1.3-1.3 1.3C9.7 21.8 2.2 14.3 2.2 4.3 2.2 3.6 2.8 3 3.5 3H7c.7 0 1.3.6 1.3 1.3 0 1.4.2 2.8.6 4.1.1.4 0 .9-.3 1.2l-2 2.2z"/>
    </svg>
  ),
};

function PropertyListItem({ data, onClick }) {
  const images = data.images?.length ? data.images : (data.image ? [data.image] : []);
  const thumbs = images.slice(1, 4);
  const photosCount = data.photosCount ?? images.length ?? data.photos ?? 0;

  const agentName = data.agent?.name || "Môi giới";
  const agentRole = data.agent?.role || "Môi giới";
  const agentAvatar = data.agent?.avatar || "";
  const agentPhone = data.agent?.phone || "";
  const zaloUrl = data.agent?.zaloUrl || "#";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* LEFT: ảnh + thumbnails + chips */}
        <div className="w-full sm:w-[320px] shrink-0">
          <div className="rounded-xl overflow-hidden">
            {images[0] ? (
              <img
                src={images[0]}
                alt={data.title}
                className="h-[210px] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-[210px] w-full bg-gray-100" />
            )}
          </div>

          {/* hàng chip: thời gian đăng + tổng số ảnh */}
          {(data.postedAt || photosCount) && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {data.postedAt && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                    <Icon.Clock /> {data.postedAt}
                  </span>
                )}
              </div>
              {photosCount ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                  <Icon.Camera /> {photosCount}
                </span>
              ) : null}
            </div>
          )}

          {thumbs.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {thumbs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="h-[70px] w-full object-cover rounded-lg"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: nội dung */}
        <div className="flex-1 min-w-0">
          {/* Tiêu đề + Giá */}
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-[18px] sm:text-[20px] font-semibold leading-snug line-clamp-2 cursor-pointer hover:text-blue-600"
              title={data.title}
              onClick={onClick}
            >
              {data.title}
            </h3>
            <div className="text-right shrink-0">
              <div className="text-blue-600 font-bold text-lg">
                {data.price || 'Thỏa thuận'}
              </div>
              {data.pricePerM2 && (
                <div className="text-xs text-gray-500">({data.pricePerM2})</div>
              )}
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <Icon.Pin />
            <span className="text-sm truncate">{data.addressMain}</span>
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1"><Icon.Area /> {data.area ?? "—"} m²</span>
            <span className="inline-flex items-center gap-1"><Icon.Bed /> {data.bed ?? "—"}</span>
            <span className="inline-flex items-center gap-1"><Icon.Bath /> {data.bath ?? "—"}</span>
          </div>

          {/* Mô tả ngắn */}
          {data.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{data.description}</p>
          )}

          {/* Agent (nền xanh nhạt, nút gọi + Zalo) */}
            <div className="mt-3 flex items-center justify-between gap-3 bg-[#f5f9ff] rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
                {data.agent?.avatar ? (
                <img
                    src={data.agent.avatar}
                    alt={data.agent.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                />
                ) : (
                <div className="h-8 w-8 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center font-semibold text-gray-600">
                    {(data.agent?.name || "M")?.charAt(0)}
                </div>
                )}
                <div className="leading-tight">
                <div
                    className="text-sm font-medium truncate max-w-[180px]"
                    title={data.agent?.name || "Môi giới"}
                >
                    {data.agent?.name || "Môi giới"}
                </div>
                <div className="text-xs text-gray-500">{data.agent?.role || "Môi giới"}</div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {data.agent?.phone && (
                <a
                    href={`tel:${String(data.agent.phone).replace(/\s/g, "")}`}
                    className="h-9 px-3 rounded-full bg-[#173b6c] text-white text-sm font-semibold flex items-center gap-2"
                >
                    <Icon.Phone />
                    {maskPhone(data.agent.phone)}
                </a>
                )}

                <a
                href={data.agent?.zaloUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="h-15 flex items-center"
                title="Zalo"
                >
                <img
                    src={zaloIcon}
                    alt="Zalo"
                    className="w-15 h-15 object-contain"
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

export default function SearchList({ items }) {
  if (!items?.length) {
    return (
      <div className="col-span-full text-center text-gray-600 py-8">
        Không có kết quả phù hợp.
      </div>
    );
  }
  return (
    <div className="mt-5 space-y-4">
      {items.map((p) => (
        <PropertyListItem
          key={p.id}
          data={p}
          onClick={() => window.location.assign(`/real-estate/${p.id}`)}
        />
      ))}
    </div>
  );
}

function maskPhone(phone) {
  if (!phone) return "";
  const p = String(phone).replace(/\s/g, "");
  // giữ 7 ký tự đầu, phần còn lại thành ***
  // ví dụ 0971509*** (giống mẫu)
  if (p.length <= 7) return p;
  return p.slice(0, 7) + "***";
}
