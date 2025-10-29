import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, Tooltip } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination as SwiperPagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Viewer from "viewerjs";
import "viewerjs/dist/viewer.min.css";

import { useDispatch, useSelector } from "react-redux";
import { fetchPropertyFavoritesThunk, clearFavorites } from "@/store/propertySlice";
import FavoriteUsersModal from "./FavoriteUsersModal";

const Box = ({ children, className = "" }) => (
  <div className={"bg-white/90 rounded-xl border border-[#e9eef7] shadow-[0_6px_18px_rgba(13,47,97,0.06)] p-4 " + className}>
    {children}
  </div>
);

export default function PostCard({ post, onOpenDetail = () => { } }) {
  const images = useMemo(() => {
    const arr = (post?.images && post.images.length ? post.images : post?.imageUrls) || [];
    return arr.length ? arr : ["https://picsum.photos/1200/800"];
  }, [post?.images, post?.imageUrls]);

  const imgWrapRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch { }
      viewerRef.current = null;
    }
    if (imgWrapRef.current) {
      try {
        viewerRef.current = new Viewer(imgWrapRef.current, {
          toolbar: {
            zoomIn: 1,
            zoomOut: 1,
            oneToOne: 1,
            reset: 1,
            prev: 1,
            next: 1,
            rotateLeft: 1,
            rotateRight: 1,
            flipHorizontal: 1,
            flipVertical: 1,
          },
          navbar: false,
          title: false,
          movable: true,
          scalable: true,
          transition: true,
          zIndex: 3000,
        });
      } catch { }
    }
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch { }
        viewerRef.current = null;
      }
    };
  }, [images]);

  const openViewerAt = (idx) => {
    if (!viewerRef.current) return;
    viewerRef.current.show();
    viewerRef.current.view(idx);
  };

  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { favoriteUsers, isLoadingFavorites, errorFavorites } = useSelector((s) => ({
    favoriteUsers: s.property.currentFavoriteUsers,
    isLoadingFavorites: s.property.loadingFavorites,
    errorFavorites: s.property.errorFavorites,
  }));

  const handleShowFavorites = (e) => {
    e.stopPropagation(); // ❗ không mở Drawer
    if (!post.favoriteCount || post.favoriteCount === 0) return;
    setIsModalOpen(true);
    dispatch(fetchPropertyFavoritesThunk(post.id));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    dispatch(clearFavorites());
  };

  // ❗ Toàn card click mở Drawer, trừ vùng ảnh
  const handleCardClick = () => {
    if (!post?.id) return;
    onOpenDetail(post.id);
  };

  // chặn click ở vùng ảnh
  const stop = (e) => e.stopPropagation();

  return (
    <>
      <div
        className="rounded-2xl bg-[#f2f6fd] p-3 border border-[#e6eefb] shadow-[0_14px_36px_rgba(13,47,97,0.08)] cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" ? handleCardClick() : null)}
        aria-label={`Mở chỉnh sửa tin #${post?.id ?? ""}`}
      >
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* LEFT: images (không mở Drawer) */}
          <div className="col-span-12 md:col-span-4" onClick={stop} onKeyDown={stop} role="presentation">
            <div className="rounded-2xl overflow-hidden relative h-full">
              <Swiper modules={[Navigation, SwiperPagination]} navigation pagination={{ clickable: true }} className="!rounded-2xl h-full">
                {images.map((src, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={src}
                      alt={`Property image ${i + 1}`}
                      className="h-[240px] w-full object-cover cursor-zoom-in"
                      onClick={() => openViewerAt(i)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found";
                      }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <button
                title="Fullscreen"
                aria-label="View images fullscreen"
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  openViewerAt(0);
                }}
              >
                {/* icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>
              <div ref={imgWrapRef} className="hidden" aria-hidden="true">
                {images.map((src, i) => (
                  <img key={i} src={src} alt={`Viewer image ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>

          {/* MID */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
            <Box>
              <div className="text-[#325cdb] font-semibold flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d7e1fb]" aria-hidden="true">
                  {" "}
                  💲{" "}
                </span>
                <span>Giá bán</span>
                <div className="ml-auto text-[22px] font-bold text-[#2b55d1]">{post.priceText}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-[15px] text-[#5b6f92]">
                <div>
                  <div className="text-[#7a8fb2]">Loại tin</div>
                  <div className="font-medium">{post.installmentText || "-"}</div>
                </div>
                <div>
                  <div className="text-[#7a8fb2]">Giá / m²</div>
                  <div className="font-medium">{post.unitPriceText || "-"}</div>
                </div>
                <div>
                  <div className="text-[#7a8fb2]">Giá đất</div>
                  <div className="font-medium">{post.landPriceText || "-"}</div>
                </div>
              </div>
            </Box>
            <Box>
              <div className="grid grid-cols-2 gap-y-3 text-[#506285]">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">🗂️</span>
                  <span>Tình trạng tin đăng</span>
                </div>
                <div className="text-right">
                  <Tag className="!m-0 !px-3 !py-1 !rounded-lg bg-[#e9f0ff] text-[#3c57d6] border-none">
                    {post.statusTag || "Nháp"}
                  </Tag>
                </div>

                <div className="flex items-center gap-2">
                  <span aria-hidden="true">🕒</span>
                  <span>Ngày tạo</span>
                </div>
                <div className="text-right">{post.createdAt || "-"}</div>

                <div className="flex items-center gap-2">
                  <span aria-hidden="true">👁</span>
                  <span>Số lượt xem</span>
                </div>
                <div className="text-right">{post.views ?? 0}</div>

                <div className="flex items-center gap-2">
                  <span aria-hidden="true">❤️</span>
                  <span>Số lượt yêu thích</span>
                </div>
                <Tooltip title={post.favoriteCount > 0 ? "Xem danh sách người yêu thích" : ""}>
                  <button
                    type="button"
                    className={`text-right font-medium focus:outline-none ${post.favoriteCount > 0 ? "text-[#ff4d4f] cursor-pointer hover:underline focus:underline" : "text-[#506285] cursor-default"
                      }`}
                    onClick={handleShowFavorites}
                    disabled={!post.favoriteCount || post.favoriteCount === 0}
                    aria-label={`Xem ${post.favoriteCount} lượt yêu thích`}
                  >
                    {post.favoriteCount ?? 0}
                  </button>
                </Tooltip>
              </div>
            </Box>
          </div>

          {/* RIGHT */}
          <div className="col-span-12 md:col-span-4 flex">
            <Box className="h-full w-full">
              <div className="space-y-4 text-[#334e7d]">
                <div className="leading-6">
                  <div className="flex items-start gap-2">
                    <span className="mt-1" aria-hidden="true">
                      📍
                    </span>
                    <div className="font-medium">{post.addressMain || "Chưa cập nhật địa chỉ"}</div>
                  </div>
                  {post.description && (
                    <div className="flex items-start gap-2 mt-1 text-[#5b6f92]">
                      <span className="w-4 flex-shrink-0" aria-hidden="true" />
                      <p className="text-[15px] leading-6 line-clamp-2">{post.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-[#415a8c]">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">📐</span>
                    <span>{post.area || "—"} m²</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">🛏</span>
                    <span>{post.bed || "—"} PN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">🛁</span>
                    <span>{post.bath || "—"} WC</span>
                  </div>
                </div>
                {post.sizeText && <div className="text-[#3a4f78]">Kích thước: {post.sizeText}</div>}
                {post.note && <div className="text-[#8a98b2]">Ghi chú: {post.note}</div>}
              </div>
            </Box>
          </div>
        </div>
      </div>

      <FavoriteUsersModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        users={favoriteUsers}
        isLoading={isLoadingFavorites}
        error={errorFavorites}
      />
    </>
  );
}
