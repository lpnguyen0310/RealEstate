// src/pages/UserDashboard/AgentProfile.jsx
import React, { useMemo, useRef } from "react";
import { Button, message, Modal } from "antd";
import {
    ShareAltOutlined,
    HeartOutlined,
    HeartFilled,
    CameraOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { openLoginModal } from "@/store/uiSlice";
import { makeSelectIsSaved, toggleFavorite } from "@/store/favoriteSlice";
import { formatVNDShort } from "@/utils/money";

/* ================= MOCK DATA (sau này thay bằng API) ================= */
const mockAgent = {
    id: 1,
    name: "Trương Trúc Viên",
    joinText: "Đã tham gia dưới 1 năm",
    sellingCount: 35,
    rentingCount: 0,
    totalPosts: 131,
    phoneDisplay: "0937 646 ***",
    phoneFull: "0937 646 123",
    zaloText: "Zalo",
};

const mockListings = [
    {
        id: 1,
        title: "Bán nhà ngay đường Vạn Kiếp, phường 1, Bình Thạnh. Giá: 3Tỷ...",
        image:
            "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800",
        priceDisplay: "3.65 tỷ",
        pricePerM2: "~91.25 triệu/m²",
        area: 40,
        displayAddress: "Phường 1, Quận Bình Thạnh, TP.HCM",
        photos: 8,
        postedAtText: "1 giờ trước",
        listingType: "VIP",
    },
    {
        id: 2,
        title: "NHÀ 1/ ĐƯỜNG NGUYỄN DUY TRINH, PHƯỜNG BÌNH TRƯNG...",
        image:
            "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
        priceDisplay: "3.99 tỷ",
        pricePerM2: "~83.13 triệu/m²",
        area: 48,
        displayAddress: "Bình Trưng Tây, Quận 2, TP.HCM",
        photos: 9,
        postedAtText: "1 giờ trước",
        listingType: "PREMIUM",
    },
];

/* ================== CARD 1 TIN – COPY CSS + LOGIC TỪ PropertyCard ================== */
function AgentListingCard({ item }) {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const imageUrl = item.image?.startsWith("/")
        ? `${origin}${item.image}`
        : item.image || item?.imageUrls?.[0] || "https://picsum.photos/800/480";

    const href = `/real-estate/${item.id}`;
    const thumb = imageUrl;

    // trạng thái đã lưu
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
            pricePerM2: item.pricePerM2,
            area: item.area,
            bed: item.bedrooms ?? item.bed,
            bath: item.bathrooms ?? item.bath,
            photos: item.photos ?? item?.imageUrls?.length ?? 0,
            postedAt: item.postedAtText ?? item.postedAt,
            listingType: item.listingType,
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

    const loginModalOpenRef = useRef(false);

    const handleHeartClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            if (loginModalOpenRef.current) return;
            loginModalOpenRef.current = true;

            Modal.confirm({
                title: "Bạn cần đăng nhập để thực hiện",
                content: "Vui lòng đăng nhập để lưu tin và đồng bộ trên nhiều thiết bị.",
                okText: "Đăng nhập",
                cancelText: "Quay lại",
                centered: true,
                maskClosable: false,
                onOk: () => {
                    dispatch(openLoginModal());
                },
                onCancel: () => { },
                afterClose: () => {
                    loginModalOpenRef.current = false;
                },
            });
            return;
        }

        dispatch(toggleFavorite({ id: item.id, payload: favPayload }))
            .unwrap()
            .catch(() => {
                message.error("Không thể lưu/bỏ lưu. Vui lòng thử lại!");
                Modal.error({
                    title: "Có lỗi xảy ra",
                    content: "Không thể lưu/bỏ lưu. Vui lòng thử lại!",
                    centered: true,
                });
            });
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        message.info("Tính năng chia sẻ sẽ có sớm!");
    };

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
                    <div className="absolute right-4 top-4 flex gap-2 z-10">
                        <button
                            type="button"
                            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow flex items-center justify-center"
                            onClick={handleShareClick}
                            aria-label="Chia sẻ"
                            title="Chia sẻ"
                        >
                            <ShareAltOutlined />
                        </button>

                        <button
                            type="button"
                            className={`w-9 h-9 rounded-full backdrop-blur-sm shadow flex items-center justify-center ${isSaved ? "bg-[#fff1ef]" : "bg-white/95 hover:bg-white"
                                }`}
                            onClick={handleHeartClick}
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
                <h3 className="text-[20px] font-extrabold text-gray-900 leading-snug line-clamp-2 min-h-[56px]">
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

/* ================== CARD THÔNG TIN MÔI GIỚI ================== */
function AgentInfoCard({ agent }) {
    return (
        <aside className="w-full lg:w-[280px]">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold">
                        {agent.name?.charAt(0) ?? "U"}
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{agent.joinText}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                    <div className="rounded-xl border border-gray-200 py-2 px-3">
                        <div className="text-xs text-gray-500 mb-1">Đang bán</div>
                        <div className="font-semibold text-lg text-gray-900">
                            {agent.sellingCount}
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 py-2 px-3">
                        <div className="text-xs text-gray-500 mb-1">Đang cho thuê</div>
                        <div className="font-semibold text-lg text-gray-900">
                            {agent.rentingCount}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-4 text-center">
                    <div className="text-xs text-gray-600 mb-1">Số tin đã đăng</div>
                    <div className="text-2xl font-semibold text-blue-600">
                        {agent.totalPosts}
                    </div>
                </div>

                <div className="space-y-2">
                    <Button
                        type="default"
                        className="w-full font-semibold flex items-center justify-center gap-2"
                    >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                            Z
                        </span>
                        {agent.zaloText}
                    </Button>

                    <Button
                        type="primary"
                        className="w-full font-semibold"
                        size="large"
                    >
                        {agent.phoneDisplay}
                    </Button>
                </div>
            </div>
        </aside>
    );
}

/* ================== PAGE ================== */
export default function AgentProfile() {
    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Cột trái: môi giới */}
                    <AgentInfoCard agent={mockAgent} />

                    {/* Cột phải: danh sách tin */}
                    <section className="flex-1">
                        <div className="flex flex-col gap-3 mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Bất động sản trên toàn quốc
                            </h1>
                            <div className="inline-flex bg-gray-100 rounded-full p-1 w-fit">
                                <button className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow">
                                    Tin bán
                                </button>
                                <button className="px-4 py-1.5 rounded-full text-sm text-gray-600">
                                    Tin thuê
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {mockListings.map((item) => (
                                <AgentListingCard key={item.id} item={item} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
