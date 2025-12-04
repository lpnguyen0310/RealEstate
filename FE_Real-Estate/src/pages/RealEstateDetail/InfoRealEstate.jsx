import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Tag, message } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Thumbs } from "swiper/modules";
import NearbyAmenities from "../../components/filters/PostFilter/NearbyAmenities";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "swiper/css/thumbs";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.min.css";

import {
    useTrackZaloClickMutation,
    useTrackShareClickMutation,
    useTrackViewPhoneMutation,
} from "@/services/trackingApi";

import { useDispatch, useSelector } from "react-redux";
import {
    fetchPropertyByIdThunk,
    clearCurrentProperty,
} from "@/store/propertySlice";
import { toggleFavorite, makeSelectIsSaved } from "@/store/favoriteSlice";

import ReportModal from "@/components/detailPost/modals/ReportModal";
import {
    DEFAULT_GALLERY_IMAGES,
    DEFAULT_POST_INFO,
    DEFAULT_DESCRIPTION,
    DEFAULT_FEATURES,
    DEFAULT_MAP,
    DEFAULT_MAP_META,
    DEFAULT_AGENT,
} from "@/data/properties";

import SimilarNews from "../../components/cards/SimilarNews";
import NotificationModal from "@/components/cards/NotificationModal";
import { openLoginModal } from "@/store/uiSlice";

/* ================= SVG ICONS (Giữ nguyên) ================= */
const ChatIcon = (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}>
        <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4v-4H4a2 2 0 01-2-2V4z" />
    </svg>
);
const PhoneIcon = (p) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}>
        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.11.37 2.31.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.5a1 1 0 011 1c0 1.27.2 2.47.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
    </svg>
);
const ChevronLeft = (p) => (
    <svg viewBox="0 0 24 24" width="1.3em" height="1.3em" fill="currentColor" {...p}>
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
);
const ChevronRight = (p) => (
    <svg viewBox="0 0 24 24" width="1.3em" height="1.3em" fill="currentColor" {...p}>
        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
    </svg>
);
const ShareIcon = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
        <path d="M18 16a3 3 0 00-2.24 1.02L8.91 13.7a3.06 3.06 0 000-3.4l6.85-3.33A3 3 0 1015 5a3 3 0 00.09.72L8.24 9.05a3 3 0 100 5.9l6.85 3.33A3 3 0 1018 16z" />
    </svg>
);
const HeartIcon = ({ filled, ...p }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
        <path
            d="M12.1 21.35l-1.1-1.02C5.14 14.88 2 12.05 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.74 3.96 1.9A5.28 5.28 0 0114.5 4C17 4 19 6 19 8.5c0 3.55-3.14 6.38-8.9 11.83l-1.1 1.02z"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
        />
    </svg>
);
const ExpandIcon = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
        <path d="M4 4h7v2H6v5H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z" />
    </svg>
);
const IconBtn = ({ children, ...rest }) => (
    <button
        className="h-9 w-9 rounded-full bg-white/90 text-gray-800 shadow hover:bg-white grid place-items-center"
        {...rest}
    >
        {children}
    </button>
);

/* =================================== COMPONENT =================================== */
export default function InfoRealEstate() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const numericId = useMemo(() => Number(id), [id]);

    // redux state
    const selectIsSaved = useMemo(() => makeSelectIsSaved(numericId), [numericId]);
    const liked = useSelector(selectIsSaved);
    const { property, loading, error } = useSelector((state) => ({
        property: state.property.currentProperty,
        loading: state.property.loadingDetail,
        error: state.property.errorDetail,
    }));
    const user = useSelector((s) => s.auth.user);

    const [trackZaloClick] = useTrackZaloClickMutation();
    const [trackShareClick] = useTrackShareClickMutation();
    const [trackViewPhone] = useTrackViewPhoneMutation();

    const [activeIndex, setActiveIndex] = useState(0);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [showPhone, setShowPhone] = useState(false);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);

    const [loginPromptOpen, setLoginPromptOpen] = useState(false);

    const hiddenGalleryRef = useRef(null);
    const viewerRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const mainSwiperRef = useRef(null);
    const phoneTrackedRef = useRef(false);

    // ===== Fetch detail via Redux
    useEffect(() => {
        if (!id) return;
        dispatch(fetchPropertyByIdThunk(id));
        return () => {
            dispatch(clearCurrentProperty());
        };
    }, [id, dispatch]);

    // ===== Set title + scroll top
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (property?.postInfo?.title) {
            document.title = `${property.postInfo.title} | Real Estate`;
        } else {
            document.title = "Thông tin | Real Estate";
        }
    }, [id, property]);

    // ===== Init ViewerJS khi gallery đổi
    useEffect(() => {
        if (!hiddenGalleryRef.current) return;
        viewerRef.current?.destroy?.();
        viewerRef.current = new Viewer(hiddenGalleryRef.current, {
            toolbar: true,
            navbar: false,
            title: false,
            movable: true,
            tooltip: false,
            transition: false,
            rotatable: false,
            scalable: false,
            zoomRatio: 0.3,
        });
        return () => viewerRef.current?.destroy?.();
    }, [property?.gallery]);

    // ===== Bind prev/next cho Swiper Navigation
    useEffect(() => {
        const s = mainSwiperRef.current;
        if (!s || !prevRef.current || !nextRef.current) return;
        s.params.navigation = {
            ...(s.params.navigation || {}),
            prevEl: prevRef.current,
            nextEl: nextRef.current,
        };
        s.navigation.destroy();
        s.navigation.init();
        s.navigation.update();
    }, [mainSwiperRef.current, prevRef.current, nextRef.current, property?.gallery]);

    // ===== Guards return
    if (loading) {
        return <div className="text-center py-20">Đang tải dữ liệu...</div>;
    }
    if (error) {
        return <div className="text-center py-20 text-red-600">Lỗi: {String(error)}</div>;
    }
    if (!property) {
        return <div className="text-center py-20">Không tìm thấy thông tin bất động sản.</div>;
    }

    // ===== Data with safe fallbacks
    const {
        gallery = DEFAULT_GALLERY_IMAGES,
        postInfo = DEFAULT_POST_INFO,
        description = DEFAULT_DESCRIPTION,
        features = DEFAULT_FEATURES,
        map = DEFAULT_MAP,
        mapMeta = DEFAULT_MAP_META,
        agent = DEFAULT_AGENT,
        listings = [], // nếu trong object có field này; nếu không có thì mặc định []
    } = property || {};

    const openViewerAt = (i) => viewerRef.current?.view(i ?? activeIndex);

    const handleShowPhone = () => {
        setShowPhone(true);
        if (!phoneTrackedRef.current && id) {
            try {
                trackViewPhone(id);
            } finally {
                phoneTrackedRef.current = true;
            }
        }
    };

    const onShare = async () => {
        try {
            trackShareClick(id);
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({ title: document.title || "BĐS", url });
            } else {
                await navigator.clipboard.writeText(url);
                message.success("Đã copy link vào clipboard");
            }
        } catch {
            message.warning("Không thể chia sẻ lúc này");
        }
    };

    const onLike = () => {
        if (!id || !property) return;

        // ✳️ CHẶN KHÁCH: yêu cầu đăng nhập trước khi lưu tin
        if (!user) {
            setLoginPromptOpen(true);
            return;
        }

        const getFeature = (key) =>
            property?.features?.left?.find((f) => f.label === key)?.value ??
            property?.features?.right?.find((f) => f.label === key)?.value;

        const parseNum = (str) =>
            parseFloat(String(str ?? "").replace(/[^0-9.-]+/g, "")) || 0;

        const favoritePayload = {
            id: numericId,
            title: property?.postInfo?.title,
            imageUrls: gallery,
            thumb: gallery?.[0],
            image: gallery?.[0],
            priceDisplay: property?.postInfo?.stats?.priceText,
            displayAddress: property?.postInfo?.address,
            pricePerM2: property?.postInfo?.stats?.pricePerM2,
            area: parseNum(property?.postInfo?.stats?.areaText),
            bed: parseNum(getFeature("Phòng ngủ")),
            bath: parseNum(getFeature("Phòng tắm")),
            photos: gallery?.length || 0,
        };

        dispatch(toggleFavorite({ id: numericId, payload: favoritePayload }));
        if (liked) message.info("Đã bỏ khỏi yêu thích");
        else message.success("Đã thêm vào yêu thích");
    };

    const handleLoginFromPrompt = () => {
        setLoginPromptOpen(false);
        dispatch(openLoginModal());
    };

    return (
        <div className="min-h-screen w-full bg-white">
            <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT: Gallery */}
                    <div className="lg:col-span-9">
                        <div className="w-full rounded-xl border border-gray-200 overflow-hidden">
                            {/* Gallery ẩn cho ViewerJS */}
                            <div className="hidden" ref={hiddenGalleryRef}>
                                {gallery?.map((src, i) => (
                                    <img key={i} src={src} alt={`viewer-${i}`} />
                                ))}
                            </div>

                            {/* 1) Ảnh lớn + overlay */}
                            <div className="relative">
                                {/* overlay icons */}
                                <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                                    <IconBtn aria-label="Chia sẻ" title="Chia sẻ" onClick={onShare}>
                                        <ShareIcon />
                                    </IconBtn>
                                    <IconBtn
                                        aria-label="Yêu thích"
                                        title="Yêu thích"
                                        onClick={onLike}
                                    >
                                        <HeartIcon filled={!!liked} />
                                    </IconBtn>
                                    <IconBtn
                                        aria-label="Phóng to"
                                        title="Phóng to"
                                        onClick={() => openViewerAt(activeIndex)}
                                    >
                                        <ExpandIcon />
                                    </IconBtn>
                                </div>

                                {/* Prev/Next */}
                                <button
                                    ref={prevRef}
                                    aria-label="Previous"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/75"
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    ref={nextRef}
                                    aria-label="Next"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/75"
                                >
                                    <ChevronRight />
                                </button>

                                {/* Swiper chính */}
                                <Swiper
                                    modules={[Navigation, Thumbs]}
                                    onSwiper={(s) => (mainSwiperRef.current = s)}
                                    onSlideChange={(s) => setActiveIndex(s.activeIndex)}
                                    thumbs={{
                                        swiper:
                                            thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
                                    }}
                                    spaceBetween={10}
                                    className="w-full h-[46vh] min-h-[320px] lg:h-[56vh]"
                                >
                                    {gallery?.map((src, idx) => (
                                        <SwiperSlide key={idx}>
                                            <img
                                                src={src}
                                                alt={`photo-${idx + 1}`}
                                                className="h-full w-full object-cover cursor-zoom-in select-none"
                                                onClick={() => openViewerAt(idx)}
                                            />
                                            <div className="absolute bottom-3 right-4 text-xs font-semibold bg-black/65 text-white px-2 py-1 rounded-md">
                                                {idx + 1} / {gallery?.length ?? 0}
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>

                            {/* 2) Thumbnails dưới */}
                            <div className="border-t border-gray-200">
                                <Swiper
                                    modules={[FreeMode, Thumbs]}
                                    onSwiper={setThumbsSwiper}
                                    freeMode
                                    watchSlidesProgress
                                    spaceBetween={12}
                                    slidesPerView={5}
                                    className="p-3"
                                    breakpoints={{
                                        320: { slidesPerView: 4 },
                                        640: { slidesPerView: 5 },
                                        1024: { slidesPerView: 6 },
                                    }}
                                >
                                    {gallery?.map((src, idx) => {
                                        const isActive = activeIndex === idx;
                                        return (
                                            <SwiperSlide key={idx}>
                                                <div
                                                    className={[
                                                        "aspect-[4/3] w-full overflow-hidden rounded-xl border transition-all duration-200",
                                                        isActive
                                                            ? "border-blue-500 ring-2 ring-blue-300 opacity-100"
                                                            : "border-gray-200 opacity-60 hover:opacity-90 filter grayscale",
                                                    ].join(" ")}
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`thumb-${idx + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Agent/Contact card + list */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-[88px] lg:top-[96px] z-10">
                            <div className="rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() =>
                                        navigate(`/agent/${agent?.id}`, {
                                            state: { agent },
                                        })
                                    }
                                >
                                    <img
                                        src={agent?.avatar}
                                        alt="avatar"
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {agent?.name}
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            {agent?.totalPosts > 1 &&
                                                agent?.totalPosts - 1 > (listings?.length || 0) ? (
                                                <>
                                                    Đang hiển thị {listings.length} tin trong tổng số{" "}
                                                    {agent?.totalPosts - 1} tin.
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/agent/${agent?.id}/posts`)
                                                        }
                                                        className="text-blue-600 hover:text-blue-800 ml-1"
                                                    >
                                                        Xem thêm {agent?.totalPosts - 1 - listings.length} tin
                                                        + khác
                                                    </button>
                                                </>
                                            ) : (
                                                "Không có bài đăng"
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-2">
                                    <Button
                                        type="default"
                                        icon={<ChatIcon />}
                                        size="large"
                                        className="w-full"
                                        onClick={() => trackZaloClick(id)}
                                    >
                                        Chat qua Zalo
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PhoneIcon />}
                                        size="large"
                                        className="w-full"
                                        onClick={handleShowPhone}
                                    >
                                        {showPhone
                                            ? agent?.phoneFull
                                            : `${agent?.phoneMasked} · Hiện số`}
                                    </Button>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {(agent?.tags ?? []).map((t) => {
                                        const lc = String(t || "").toLowerCase();
                                        let color = "blue";
                                        if (lc.includes("đã xác thực")) color = "green";
                                        if (lc.includes("không phải chính chủ")) color = "volcano";
                                        if (lc.includes("chính chủ") && !lc.includes("không"))
                                            color = "geekblue";
                                        return (
                                            <Tag key={t} color={color}>
                                                {t}
                                            </Tag>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Info strip dưới tiêu đề ===== */}
                <div className="mt-6">
                    {/* Breadcrumb */}
                    <div className="text-sm text-gray-500 mb-[15px]">
                        {postInfo?.breadcrumb?.slice(0, 3)?.join(" / ")}
                        {postInfo?.breadcrumb?.[3] && (
                            <>
                                {" / "}
                                <span className="text-gray-600">{postInfo.breadcrumb[3]}</span>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
                        {postInfo?.title}
                    </h1>

                    {/* Address */}
                    <div className="mt-2 text-gray-600">{postInfo?.address}</div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-3 text-gray-500">
                        <button
                            className="hover:text-gray-700 inline-flex items-center gap-1"
                            onClick={onShare}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill="currentColor"
                            >
                                <path d="M18 16a3 3 0 00-2.24 1.02L8.91 13.7a3.06 3.06 0 000-3.4l6.85-3.33A3 3 0 1015 5a3 3 0 00.09.72L8.24 9.05a3 3 0 100 5.9l6.85 3.33A3 3 0 1018 16z" />
                            </svg>
                            Chia sẻ
                        </button>

                        <button
                            className={[
                                "inline-flex items-center gap-1",
                                liked
                                    ? "text-blue-600 font-semibold hover:text-blue-700"
                                    : "text-gray-500 hover:text-gray-700",
                            ].join(" ")}
                            onClick={onLike}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill={liked ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path d="M12.1 21.35l-1.1-1.02C5.14 14.88 2 12.05 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.74 3.96 1.9A5.28 5.28 0 0114.5 4C17 4 19 6 19 8.5c0 3.55-3.14 6.38-8.9 11.83l-1.1 1.02z" />
                            </svg>
                            {liked ? "Đã lưu" : "Lưu tin"}
                        </button>

                        <button
                            className="hover:text-gray-700 inline-flex items-center gap-1"
                            onClick={() => setIsReportModalVisible(true)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill="currentColor"
                            >
                                <path d="M13 3l-1 2H6v12h6l1 2h5V3h-5z" />
                            </svg>
                            Báo cáo
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-gray-500">Khoảng giá</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {postInfo?.stats?.priceText}
                            </div>
                            <div className="text-xs text-gray-500">
                                {postInfo?.stats?.pricePerM2}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Diện tích</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {postInfo?.stats?.areaText}
                            </div>
                            <div className="text-xs text-gray-500">
                                {postInfo?.stats?.frontageText}
                            </div>
                        </div>
                        <div className="sm:block hidden" />
                    </div>

                    {/* Growth notice */}
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-medium">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-emerald-300">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4"
                                    fill="currentColor"
                                >
                                    <path d="M7 14l5-5 5 5H7z" />
                                </svg>
                            </span>
                            <span>{postInfo?.growthNotice?.text}</span>
                        </div>
                        <button className="text-emerald-700 font-semibold hover:underline">
                            {postInfo?.growthNotice?.cta}
                        </button>
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Thông tin mô tả
                        </h2>
                        <div className="mt-3 space-y-3 text-gray-800 leading-relaxed">
                            {description?.headline && (
                                <p className="uppercase font-medium">
                                    {description.headline}
                                </p>
                            )}

                            <ul className="list-disc pl-5 space-y-1">
                                {(description?.bullets ?? []).map((b, i) => (
                                    <li key={`${b}-${i}`}>{b}</li>
                                ))}
                            </ul>

                            <div className="space-y-1">
                                {description?.nearbyTitle && (
                                    <div className="font-semibold text-gray-900">
                                        {description.nearbyTitle}
                                    </div>
                                )}
                                {(description?.nearby ?? []).map((n, i) => (
                                    <p key={`${n}-${i}`}>{n}</p>
                                ))}
                            </div>

                            <div className="space-y-2">
                                {description?.priceLine && (
                                    <p>
                                        <b>{description.priceLine}</b>
                                    </p>
                                )}
                                {description?.suggest && <p>{description.suggest}</p>}
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Lh.</span>
                                    <span className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm">
                                        {agent?.phoneMasked}
                                    </span>
                                    <button
                                        onClick={handleShowPhone}
                                        className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                                    >
                                        {showPhone ? agent?.phoneFull : "Hiện số"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mt-10">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Đặc điểm bất động sản
                        </h2>

                        <div className="mt-4 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                                <div className="divide-y">
                                    {(features?.left ?? []).map(({ label, value }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between py-4"
                                        >
                                            <span className="text-gray-700">{label}</span>
                                            <span className="text-gray-900">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="divide-y">
                                    {(features?.right ?? []).map(({ label, value }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between py-4"
                                        >
                                            <span className="text-gray-700">{label}</span>
                                            <span className="text-gray-900">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map + meta */}
                    <div className="mt-10">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Khám phá tiện ích
                        </h2>
                        <NearbyAmenities
                            center={{
                                lat: map?.lat ?? 10.792,
                                lng: map?.lng ?? 106.68,
                            }}
                            address={postInfo?.address}
                        />
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(mapMeta ?? []).map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="text-gray-500 text-sm">{label}</div>
                                    <div className="mt-1 font-semibold text-gray-900">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Similar news */}
                    <div className="mt-10">
                        <SimilarNews />
                    </div>

                    <ReportModal
                        postId={id}
                        visible={isReportModalVisible}
                        onCancel={() => setIsReportModalVisible(false)}
                    />
                </div>
            </div>

            {/* 🔔 Modal nhắc đăng nhập khi bấm Lưu tin mà chưa login */}
            <NotificationModal
                visible={loginPromptOpen}
                onClose={() => setLoginPromptOpen(false)}
                onLoginClick={handleLoginFromPrompt}
                title="Bạn cần đăng nhập"
                content="Vui lòng đăng nhập để lưu tin và đồng bộ trên nhiều thiết bị."
            />
        </div>
    );
}
