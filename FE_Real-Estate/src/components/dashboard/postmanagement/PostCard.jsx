import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, Tooltip, Dropdown, Button, Space } from "antd";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";

/* ---------- helpers ---------- */
const Box = ({ children, className = "" }) => (
  <div className={"bg-white/90 rounded-xl border border-[#e9eef7] shadow-[0_6px_18px_rgba(13,47,97,0.06)] p-4 " + className}>
    {children}
  </div>
);

const STATUS_STYLE = {
  active: { label: "Đang Đăng", cls: "bg-green-50  border-green-200  text-[#027a48]" },
  pending: { label: "Chờ Duyệt", cls: "bg-amber-50  border-amber-200  text-[#b54708]" },
  draft: { label: "Nháp", cls: "bg-slate-50  border-slate-200  text-[#334155]" },
  hidden: { label: "Đã Ẩn", cls: "bg-slate-50  border-slate-200  text-[#334155]" },
  expired: { label: "Hết Hạn", cls: "bg-zinc-50   border-zinc-200   text-[#3f3f46]" },
  expiringSoon: { label: "Sắp Hết Hạn", cls: "bg-orange-50 border-orange-200 text-[#9a3412]" },
  rejected: { label: "Bị Từ Chối", cls: "bg-red-50    border-red-200    text-[#b42318]" },
  warned: { label: "Cần Chỉnh Sửa", cls: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  archived: { label: "Thành Công", cls: "bg-emerald-50 border-emerald-200 text-[#046c4e]" }
};
const getStatusStyle = (key) => STATUS_STYLE[key] ?? STATUS_STYLE.draft;

/* ---------- component ---------- */
export default function PostCard({
  post,
  onOpenDetail = () => { },
  onConfirmSuccess = (id) => console.log("confirm success:", id),
  onHidePost = (id) => console.log("hide post:", id),
  onUnhidePost = (id) => console.log("unhide post:", id), // 🆕
  onViewWarning = () => { },
  isHighlighted = false,
}) {
  /* ====== images + viewer ====== */
  const images = useMemo(() => {
    const arr = (post?.images && post.images.length ? post.images : post?.imageUrls) || [];
    return arr.length ? arr : ["https://picsum.photos/1200/800"];
  }, [post?.images, post?.imageUrls]);

  const imgWrapRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (viewerRef.current) {
      try { viewerRef.current.destroy(); } catch { }
      viewerRef.current = null;
    }
    if (imgWrapRef.current) {
      try {
        viewerRef.current = new Viewer(imgWrapRef.current, {
          toolbar: { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, prev: 1, next: 1, rotateLeft: 1, rotateRight: 1, flipHorizontal: 1, flipVertical: 1 },
          navbar: false, title: false, movable: true, scalable: true, transition: true, zIndex: 3000,
        });
      } catch { }
    }
    return () => {
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch { }
        viewerRef.current = null;
      }
    };
  }, [images]);

  const openViewerAt = (idx) => {
    if (!viewerRef.current) return;
    viewerRef.current.show();
    viewerRef.current.view(idx);
  };

  /* ====== favorites modal ====== */
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const favoriteUsers = useSelector((s) => s.property.currentFavoriteUsers);
  const isLoadingFavorites = useSelector((s) => s.property.loadingFavorites);
  const errorFavorites = useSelector((s) => s.property.errorFavorites);

  const handleShowFavorites = (e) => {
    e.stopPropagation();
    if (!post.favoriteCount || post.favoriteCount === 0) return;
    setIsModalOpen(true);
    dispatch(fetchPropertyFavoritesThunk(post.id));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    dispatch(clearFavorites());
  };

  const handleCardClick = () => {
    if (!post?.id) return;
    onOpenDetail(post.id);
  };

  const stop = (e) => e.stopPropagation();

  /* ====== menu 3 chấm (động theo trạng thái) ====== */
  const isHidden = (post?.statusKey || "").toLowerCase() === "hidden";
  const menuItems = [
    { key: "confirm", label: "Xác nhận giao dịch thành công" },
    { type: "divider" },
    isHidden
      ? { key: "unhide", label: "Hiện lại tin" }
      : { key: "hide", danger: true, label: "Ẩn tin" },
  ];

  /* ====== ConfirmDialog state ====== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState({
    type: "",
    title: "",
    content: "",
    onConfirm: null,
  });

  const openConfirm = (meta) => {
    setConfirmMeta(meta);
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmDisabled(false);
    setConfirmLoading(false);
    setConfirmMeta({ type: "", title: "", content: "", onConfirm: null });
  };

  const onMenuClick = ({ key, domEvent }) => {
    domEvent?.stopPropagation?.();

    if (key === "confirm") {
      openConfirm({
        type: "confirm",
        title: "Xác nhận giao dịch đã hoàn tất?",
        content: `Bạn sắp xác nhận tin #${post.id} đã giao dịch thành công.`,
        onConfirm: async () => {
          try {
            setConfirmLoading(true);
            setConfirmDisabled(true);
            await Promise.resolve(onConfirmSuccess(post.id));
            closeConfirm();
          } catch (e) {
            setConfirmLoading(false);
            setConfirmDisabled(false);
          }
        },
      });
    } else if (key === "hide") {
      openConfirm({
        type: "hide",
        title: "Ẩn tin này khỏi danh sách hiển thị?",
        content: `Tin #${post.id} sẽ bị ẩn khỏi danh sách hiển thị công khai.`,
        onConfirm: async () => {
          try {
            setConfirmLoading(true);
            setConfirmDisabled(true);
            await Promise.resolve(onHidePost(post.id));
            closeConfirm();
          } catch (e) {
            setConfirmLoading(false);
            setConfirmDisabled(false);
          }
        },
      });
    } else if (key === "unhide") {
      openConfirm({
        type: "unhide",
        title: "Hiện lại tin này?",
        content: `Tin #${post.id} sẽ được hiển thị công khai trở lại.`,
        onConfirm: async () => {
          try {
            setConfirmLoading(true);
            setConfirmDisabled(true);
            await Promise.resolve(onUnhidePost(post.id));
            closeConfirm();
          } catch (e) {
            setConfirmLoading(false);
            setConfirmDisabled(false);
          }
        },
      });
    }
  };

  /* ====== highlight scroll ====== */
  const cardRef = useRef(null);
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted, post?.id]);

  /* ====== render ====== */
  return (
    <>
      <div
        ref={cardRef}
        id={`post-item-${post.id}`}
        className={`
          relative rounded-2xl bg-[#f2f6fd] p-3 border border-[#e6eefb] 
          shadow-[0_14px_36px_rgba(13,47,97,0.08)] cursor-pointer
          ${isHighlighted ? "post-highlight-animation" : ""}
        `}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" ? handleCardClick() : null)}
        aria-label={`Mở chỉnh sửa tin #${post?.id ?? ""}`}
      >
        {/* Nút menu ba chấm */}
        <Dropdown
          menu={{ items: menuItems, onClick: onMenuClick }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <button
            className="absolute top-2 right-2 z-20 h-9 w-9 rounded-full bg-white/90 border border-[#e5eaf5] shadow flex items-center justify-center hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Mở menu hành động"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="19" cy="12" r="2"></circle>
            </svg>
          </button>
        </Dropdown>

        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* LEFT: images */}
          <div className="col-span-12 md:col-span-4" onClick={stop} onKeyDown={stop} role="presentation">
            <div className="rounded-2xl overflow-hidden relative h-full">
              <Swiper modules={[Navigation, SwiperPagination]} navigation pagination={{ clickable: true }} className="!rounded-2xl h-full">
                {images.map((src, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={src}
                      alt={`Property image ${i + 1}`}
                      className="h[240px] md:h-[240px] w-full object-cover cursor-zoom-in"
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
                onClick={(e) => { e.stopPropagation(); openViewerAt(0); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
              <div ref={imgWrapRef} className="hidden" aria-hidden="true">
                {images.map((src, i) => (<img key={i} src={src} alt={`Viewer image ${i + 1}`} />))}
              </div>
            </div>
          </div>

          {/* MID */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
            <Box>
              <div className="text-[#325cdb] font-semibold flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d7e1fb]" aria-hidden="true"> 💲 </span>
                <span>Giá bán</span>
                <div className="ml-auto text-[22px] font-bold text-[#2b55d1]">{post.priceText}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-[15px] text-[#5b6f92]">
                <div><div className="text-[#7a8fb2]">Loại tin</div><div className="font-medium">{post.installmentText || "-"}</div></div>
                <div><div className="text-[#7a8fb2]">Giá / m²</div><div className="font-medium">{post.unitPriceText || "-"}</div></div>
                <div><div className="text-[#7a8fb2]">Giá đất</div><div className="font-medium">{post.landPriceText || "-"}</div></div>
              </div>
            </Box>
            <Box>
              <div className="grid grid-cols-2 gap-y-3 text-[#506285]">
                <div className="flex items-center gap-2"><span aria-hidden="true">🗂️</span><span>Tình trạng tin đăng</span></div>
                {(() => {
                  const stKey = post?.statusKey || "draft";
                  const isWarned = stKey === "warned";
                  const { label, cls } = getStatusStyle(stKey);

                  if (isWarned) {
                    return (
                      <div className="text-right">
                        <Space size="small" wrap align="center" className="justify-end">
                          <span className={"inline-flex items-center justify-center px-3 py-1 rounded-xl border text-sm font-medium " + cls}>
                            {label}
                          </span>
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewWarning(post.latestWarningMessage);
                            }}
                          >
                            Xem lý do
                          </Button>
                        </Space>
                      </div>
                    );
                  }

                  return (
                    <div className="text-right">
                      <span className={"inline-flex items-center justify-center px-3 py-1 rounded-xl border text-sm font-medium " + cls}>
                        {label}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2"><span aria-hidden="true">🕒</span><span>Ngày tạo</span></div>
                <div className="text-right">{post.createdAt || "-"}</div>

                <div className="flex items-center gap-2"><span aria-hidden="true">👁</span><span>Số lượt xem</span></div>
                <div className="text-right">{post.views ?? 0}</div>

                <div className="flex items-center gap-2"><span aria-hidden="true">❤️</span><span>Số lượt yêu thích</span></div>
                <Tooltip title={post.favoriteCount > 0 ? "Xem danh sách người yêu thích" : ""}>
                  <button
                    type="button"
                    className={`text-right font-medium focus:outline-none ${post.favoriteCount > 0 ? "text-[#ff4d4f] cursor-pointer hover:underline focus:underline" : "text-[#506285] cursor-default"}`}
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
            <div className="h-full w-full">
              <Box className="h-full w-full">
                <div className="space-y-4 text-[#334e7d]">
                  <div className="leading-6">
                    <div className="flex items-start gap-2">
                      <span className="mt-1" aria-hidden="true">📍</span>
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
                    <div className="flex items-center gap-2"><span aria-hidden="true">📐</span><span>{post.area || "—"} m²</span></div>
                    <div className="flex items-center gap-2"><span aria-hidden="true">🛏</span><span>{post.bed || "—"} PN</span></div>
                    <div className="flex items-center gap-2"><span aria-hidden="true">🛁</span><span>{post.bath || "—"} WC</span></div>
                  </div>
                  {post.sizeText && <div className="text-[#3a4f78]">Kích thước: {post.sizeText}</div>}
                  {post.note && <div className="text-[#8a98b2]">Ghi chú: {post.note}</div>}
                </div>

                {post.statusKey === "rejected" && post.rejectReason && (
                  <div
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[#b42318]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      <span>🚫</span>
                      <span>Lý do từ chối tin đăng</span>
                    </div>
                    <div className="text-sm leading-6">{post.rejectReason}</div>
                  </div>
                )}
              </Box>
            </div>
          </div>
        </div>
      </div>

      {/* Modal danh sách người yêu thích */}
      <FavoriteUsersModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        users={favoriteUsers}
        isLoading={isLoadingFavorites}
        error={errorFavorites}
      />

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmMeta.title}
        content={confirmMeta.content}
        confirmText={
          confirmMeta.type === "hide"
            ? "Ẩn tin"
            : confirmMeta.type === "unhide"
              ? "Hiện lại"
              : "Xác nhận"
        }
        cancelText="Hủy"
        loading={confirmLoading}
        confirmDisabled={confirmDisabled}
        onClose={closeConfirm}
        onConfirm={confirmMeta.onConfirm}
      />
    </>
  );
}
