import { useEffect, useMemo, useRef } from "react";
import { Tag } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination as SwiperPagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Viewer from "viewerjs";
import "viewerjs/dist/viewer.min.css";

const Box = ({ children, className = "" }) => (
    <div
        className={
            "bg-white/90 rounded-xl border border-[#e9eef7] shadow-[0_6px_18px_rgba(13,47,97,0.06)] p-4 " +
            className
        }
    >
        {children}
    </div>
);

export default function PostCard({ post }) {
    // ===== IMAGES =====
    const images = useMemo(() => {
        const arr =
            (post?.images && post.images.length
                ? post.images
                : post?.imageUrls) || [];
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

    return (
        <div className="rounded-2xl bg-[#f2f6fd] p-3 border border-[#e6eefb] shadow-[0_14px_36px_rgba(13,47,97,0.08)]">
            <div className="grid grid-cols-12 gap-3 items-stretch">
                {/* LEFT: images */}
                <div className="col-span-12 md:col-span-4">
                    <div className="rounded-2xl overflow-hidden relative h-full">
                        <Swiper
                            modules={[Navigation, SwiperPagination]}
                            navigation
                            pagination={{ clickable: true }}
                            className="!rounded-2xl h-full"
                        >
                            {images.map((src, i) => (
                                <SwiperSlide key={i}>
                                    <img
                                        src={src}
                                        alt=""
                                        className="h-[240px] w-full object-cover cursor-zoom-in"
                                        onClick={() => openViewerAt(i)}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        <button
                            title="Fullscreen"
                            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white"
                            onClick={() => openViewerAt(0)}
                        >
                            ⤢
                        </button>

                        <div ref={imgWrapRef} className="hidden" aria-hidden="true">
                            {images.map((src, i) => (
                                <img key={i} src={src} alt={`viewer-${i}`} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* MID */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
                    <Box>
                        <div className="text-[#325cdb] font-semibold flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d7e1fb]">
                                💲
                            </span>
                            <span>Giá bán</span>
                            <div className="ml-auto text-[22px] font-bold text-[#2b55d1]">
                                {post.priceText}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4 text-[15px] text-[#5b6f92]">
                            <div>
                                <div className="text-[#7a8fb2]">Mua Bán</div>
                                <div className="font-medium">{post.installmentText || "-"}</div>
                            </div>
                            <div>
                                <div className="text-[#7a8fb2]">Giá bán</div>
                                <div className="font-medium">{post.unitPriceText || ""}</div>
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
                                <span className="text-[#6a84f5]">🗂️</span>
                                <span>Tình trạng tin đăng</span>
                            </div>
                            <div className="text-right">
                                <Tag className="!m-0 !px-3 !py-1 !rounded-lg bg-[#e9f0ff] text-[#3c57d6] border-none">
                                    {post.statusTag || "Nháp"}
                                </Tag>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[#6a84f5]">🕒</span>
                                <span>Ngày tạo</span>
                            </div>
                            <div className="text-right">{post.createdAt}</div>

                            <div className="flex items-center gap-2">
                                <span className="text-[#6a84f5]">👁</span>
                                <span>Số lượt xem</span>
                            </div>
                            <div className="text-right">{post.views ?? 0}</div>
                        </div>
                    </Box>
                </div>

                {/* RIGHT */}
                <div className="col-span-12 md:col-span-4 flex">
                    <Box className="h-full w-full">
                        <div className="space-y-4 text-[#334e7d]">
                            <div className="leading-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-[#6a84f5]">📍</span>
                                    <div className="font-medium">{post.addressMain}</div>
                                </div>
                                {post.description && (
                                    <div className="flex items-start gap-2 mt-1 text-[#5b6f92]">
                                        <span />
                                        <p className="text-[15px] leading-6 line-clamp-1">
                                            {post.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-5 text-[#415a8c]">
                                <div className="flex items-center gap-2">
                                    <span>📐</span>
                                    <span>{post.area || "—"} m²</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🛏</span>
                                    <span>{post.bed || "—"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🛁</span>
                                    <span>{post.bath || "—"}</span>
                                </div>
                            </div>

                            <div className="text-[#3a4f78]">
                                {post.sizeText || "—"}
                            </div>
                            <div className="text-[#8a98b2]">{post.note || "-"}</div>
                        </div>
                    </Box>
                </div>
            </div>
        </div>
    );
}
