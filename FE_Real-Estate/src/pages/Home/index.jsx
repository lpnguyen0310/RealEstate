import { useEffect, useState } from "react";
import { Carousel, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchBannerListingsThunk } from "@/store/propertySlice"; // (Kiểm tra lại đường dẫn)
import { EnvironmentOutlined, DollarCircleOutlined } from "@ant-design/icons";

import FeatureTools from "../../components/button/FeatureTools";
import FeaturedList from "../../components/cards/FeaturedList";
import ForYouList from "../../components/cards/ForYouList";
import SiteReviewsSection from "../../components/sections/SiteReviewsSection";

import FeaturedProjects from "../../components/sections/FeaturedProjects";
import FirstTimeBuyerGuide from "../../components/sections/FirstTimeBuyerGuide";
import BannerCta from "../../components/sections/BannerCta";

import bannerPlanning from "../../assets/home-section4-image-bg.png";
import bannerResearch from "../../assets/home-section6-image-bg.png";
import bannerPosting from "../../assets/home-section7-image-bg.png";
import bannerContact from "../../assets/home-section8-image-bg.png";

import MetroModal from "../../components/search/MetroModal";
import SearchCard from "../../components/search/SearchCard";
import siteReviewApi from "../../api/siteReviewApi";
const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    if (price >= 1_000_000_000) {
        return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (price >= 1_000_000) {
        return `${(price / 1_000_000).toFixed(0)} triệu`;
    }
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
};

function BannerSlide({ property }) {
    const navigate = useNavigate();
    if (!property) return null;

    // Mapper 'mapPublicPropertyToCard' của bạn dùng 'image' (ảnh bìa)
    const imageUrl =
        property.image ||
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop";

    return (
        <div
            className="w-full h-[220px] sm:h-[260px] lg:h-[300px] relative cursor-pointer group"
            // Sửa lại đường dẫn chi tiết cho đúng (ví dụ)
            onClick={() => navigate(`/real-estate/${property.id}`)}
        >
            {/* Ảnh nền */}
            <img
                className="w-full h-full object-cover"
                src={imageUrl}
                alt={property.title}
            />
            {/* Lớp phủ mờ + transition */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />

            {/* Nội dung text */}
            <div className="absolute bottom-0 left-0 px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6 text-white w-full">
                <h3 className="font-semibold text-lg leading-tight group-hover:underline truncate">
                    {property.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm flex-nowrap">
                    <span className="flex items-center gap-1 flex-shrink-0">
                        <DollarCircleOutlined />
                        {property.price}
                    </span>
                    <span className="flex items-center gap-1 opacity-80 truncate min-w-0">
                        <EnvironmentOutlined />
                        {property.addressMain || "Đang cập nhật"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const [showMetro, setShowMetro] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [reviewSummary, setReviewSummary] = useState(null);
    useEffect(() => {
        let mounted = true;

        siteReviewApi
            .getSummary(5)
            .then((res) => {
                if (mounted) setReviewSummary(res.data);
            })
            .catch((err) => {
                console.error("Load site reviews error:", err);
            });

        return () => {
            mounted = false;
        };
    }, []);
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const {
        bannerListings,
        isLoading,
        error,
    } = useSelector((state) => ({
        bannerListings: state.property.bannerListings,
        isLoading: state.property.bannerListingsLoading,
        error: state.property.bannerListingsError,
    }));

    // ⭐️ GỌI THUNK KHI COMPONENT MOUNT
    useEffect(() => {
        dispatch(fetchBannerListingsThunk());
    }, [dispatch]);

    useEffect(() => {
        const handleOpen = () => setShowMetro(true);
        window.addEventListener("open-metro-panel", handleOpen);
        return () => window.removeEventListener("open-metro-panel", handleOpen);
    }, []);

    const executeSearchFromParams = (paramsObject = {}) => {
        const mode = "buy";
        const final = { ...paramsObject };
        if (!final.type) final.type = mode === "buy" ? "sell" : "rent";

        if (final.q) final.q = String(final.q).trim();
        delete final.keyword;

        const params = new URLSearchParams();
        Object.entries(final).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length) {
                params.set(k, String(v));
            }
        });

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full">
            {/* ================= HERO ================= */}
            <section className="relative w-full bg-gradient-to-br from-[#1b2a57] via-[#23356c] to-[#2b5aa6] text-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 pt-10 lg:pt-16 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-[36px] leading-[1.15] font-extrabold sm:text-[44px] lg:text-[56px]">
                                Tìm nhà thông thái
                                <br />
                                Thoải mái an cư
                            </h1>
                            <p className="mt-4 text-white/85 text-[15px] lg:text-[17px] max-w-[560px]">
                                Nền tảng bất động sản đầu tiên tối ưu trải nghiệm tìm bất động
                                sản theo tiêu chí nâng cao. Hàng ngàn bất động sản phù hợp{" "}
                                <span className="font-semibold">dành riêng cho bạn</span>. Bắt đầu
                                tìm kiếm ngay!
                            </p>
                        </div>
                        <div className="w-full">
                            <div className="bg-white/5 rounded-2xl overflow-hidden shadow-xl">

                                {/* ⭐️ SỬA LẠI LOGIC RENDER CAROUSEL */}
                                {isLoading && (
                                    <div className="h-[220px] sm:h-[260px] lg:h-[300px] flex items-center justify-center">
                                        <Spin />
                                    </div>
                                )}
                                {error && (
                                    <div className="h-[220px] sm:h-[260px] lg:h-[300px] flex items-center justify-center p-4">
                                        <Alert message={error} type="error" />
                                    </div>
                                )}

                                {/* Khi load xong và có data */}
                                {!isLoading && !error && bannerListings.length > 0 && (
                                    <Carousel
                                        autoplay
                                        dots
                                        className="h-[220px] sm:h-[260px] lg:h-[300px]"
                                    >
                                        {bannerListings.map((property) => (
                                            <div key={property.id} className="h-full">
                                                {/* Dùng component slide mới */}
                                                <BannerSlide property={property} />
                                            </div>
                                        ))}
                                    </Carousel>
                                )}

                                {/* Khi không load, không lỗi, nhưng không có tin nào (dùng ảnh default) */}
                                {!isLoading && !error && bannerListings.length === 0 && (
                                    <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
                                        <img
                                            className="w-full h-full object-cover"
                                            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop"
                                            alt="banner-default"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <SearchCard />
            <section className="bg-[#f7fafc] pt-12 lg:pt-16 pb-24">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <FeatureTools />
                    <ForYouList />
                    <FeaturedList />

                    <BannerCta
                        title="Tra cứu quy hoạch"
                        description={
                            <>Kiểm tra quy hoạch online theo: số tờ, số thửa, tọa độ… với độ chính xác cao và dữ liệu mới nhất.</>
                        }
                        buttonLabel="Khám phá ngay"
                        href="/tra-cuu-quy-hoach"
                        bg={bannerPlanning}
                        side="right"
                        tone="light"
                        minH={300}
                    />

                    <FeaturedProjects />
                    <FirstTimeBuyerGuide />
                    <SiteReviewsSection
                        reviews={reviewSummary?.reviews ?? []}
                    // nếu muốn sau này dùng average từ BE:
                    // averageRating={reviewSummary?.averageRating}
                    // totalReviews={reviewSummary?.totalReviews}
                    />

                    <BannerCta
                        title="Tra cứu kế hoạch"
                        description={
                            <>Kiểm tra quy hoạch online theo: số tờ, số thửa, toạ độ... với độ chính xác cao và dữ liệu mới nhất</>
                        }
                        buttonLabel="Khám phá ngay"
                        href="/dang-tin"
                        bg={bannerResearch}
                        side="left"
                        tone="dark"
                        minH={320}
                    />

                    <BannerCta
                        title="Đăng tin chuyên nghiệp"
                        description={
                            <>
                                Muốn tìm khách hàng chất lượng? Khám phá giải pháp đăng tin toàn diện tại
                                Radanhadat.vn với cực nhiều ưu đãi trong giai đoạn ra mắt nền tảng
                            </>
                        }
                        buttonLabel="Đăng tin ngay"
                        href="/dang-tin"
                        bg={bannerPosting}
                        side="right"
                        tone="dark"
                        minH={320}
                    />

                    <BannerCta
                        title="“Làm” nội thất đẹp mê say"
                        description={<>Giảm ngay 5% khi làm nội thất cùng dg home</>}
                        buttonLabel="Khám phá ngay"
                        href="/dang-tin"
                        bg={bannerContact}
                        side="left"
                        tone="dark"
                        minH={320}
                    />
                </div>
            </section>

            {/* ================= MODAL METRO ================= */}
            <MetroModal
                open={showMetro}
                onClose={() => setShowMetro(false)}
                mapKey={mapKey}
                onSearch={(stations) => {
                    // stations: [{ id, name, lat, lng, ... }]
                    const names = (stations || [])
                        .map(s => s?.name?.trim())
                        .filter(Boolean);
                    const keyword = names.join(" ");
                    executeSearchFromParams({
                        q: keyword,
                        type: "sell",
                        kwMode: names.length > 1 ? "any" : "all",
                    });

                    setShowMetro(false);
                }}
            />
        </div>
    );
}
