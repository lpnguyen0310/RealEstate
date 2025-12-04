import React, { useMemo } from "react";
import { Carousel, Rate, Avatar, ConfigProvider } from "antd";
import { UserOutlined, StarFilled, LeftOutlined, RightOutlined } from "@ant-design/icons";

// Nút điều hướng custom cho Carousel
const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <button
        {...props}
        className={
            "absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full " +
            "bg-white shadow-md border border-slate-200 flex items-center justify-center " +
            "text-slate-600 hover:text-[#2856d5] hover:border-[#2856d5] transition-all " +
            (currentSlide === 0 ? " opacity-40 cursor-not-allowed" : "")
        }
        aria-hidden="true"
        aria-disabled={currentSlide === 0}
    >
        <LeftOutlined style={{ fontSize: 14 }} />
    </button>
);

const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <button
        {...props}
        className={
            "absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full " +
            "bg-white shadow-md border border-slate-200 flex items-center justify-center " +
            "text-slate-600 hover:text-[#2856d5] hover:border-[#2856d5] transition-all " +
            (currentSlide === slideCount - 1 ? " opacity-40 cursor-not-allowed" : "")
        }
        aria-hidden="true"
        aria-disabled={currentSlide === slideCount - 1}
    >
        <RightOutlined style={{ fontSize: 14 }} />
    </button>
);

export default function SiteReviewsSection({ reviews = [] }) {
    const hasReviews = reviews && reviews.length > 0;

    const avgRating = hasReviews
        ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        : 0;

    const sortedReviews = useMemo(
        () =>
            hasReviews
                ? [...reviews].sort((a, b) => (b.rating || 0) - (a.rating || 0))
                : [],
        [hasReviews, reviews]
    );

    const ratingBuckets = useMemo(() => {
        if (!hasReviews) return [];
        const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
            const star = Math.round(r.rating || 0);
            if (star >= 1 && star <= 5) buckets[star] += 1;
        });
        return [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: buckets[star],
        }));
    }, [hasReviews, reviews]);

    const totalReviews = reviews.length || 1;

    // Gọn: desktop hiển thị ~1.25 card, mobile 1 card
    // Gọn: desktop hiển thị ~1.25 card, mobile 1 card
    const carouselSettings = {
        dots: true,
        infinite: sortedReviews.length > 1, // hoặc true nếu muốn loop mãi
        speed: 400,
        slidesToShow: 1.00,
        slidesToScroll: 1,
        arrows: true,
        prevArrow: <SlickArrowLeft />,
        nextArrow: <SlickArrowRight />,

        // 🔹 Thêm mấy dòng này để tự động chạy
        autoplay: true,
        autoplaySpeed: 5000,   // 5s đổi 1 review
        pauseOnHover: true,    // hover vào thì dừng

        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 1.15,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 1.05,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#2856d5",
                    borderRadius: 16,
                },
                components: {
                    Carousel: {
                        dotWidth: 6,
                        dotActiveWidth: 18,
                        dotHeight: 6,
                    },
                },
            }}
        >
            <section className="w-full bg-slate-50 py-10 lg:py-16">
                {/* bỏ max-w + mx-auto, chỉ padding 2 bên */}
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* HEADER */}
                    <div className="mb-8 text-center max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-3">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Đánh giá từ cộng đồng
                        </span>
                        <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 leading-tight">
                            Khách hàng nói gì về{" "}
                            <span className="text-[#2856d5]">N2RealEstate</span>?
                        </h2>
                        <p className="mt-3 text-slate-500 text-sm sm:text-[15px]">
                            Các đánh giá được ghi nhận sau khi khách hàng hoàn tất giao dịch
                            hoặc trải nghiệm các tính năng trên nền tảng.
                        </p>
                    </div>

                    {!hasReviews ? (
                        <EmptyState />
                    ) : (
                        // CARD chung 2 cột, cùng chiều cao
                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 px-5 py-6 lg:px-7 lg:py-7 flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch">
                            {/* STATS (trái) – Compact Modern */}
                            <div className="w-full lg:w-[38%] flex-shrink-0">
                                <div
                                    className="
            relative
            rounded-xl
            bg-gradient-to-br from-[#eef3ff] via-white to-[#e7efff]
            border border-[#d6e4ff]
            shadow-[0_10px_25px_rgba(15,23,42,0.06)]
            p-5 lg:p-5
            overflow-hidden
        "
                                >
                                    {/* Decorative blur circles */}
                                    <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-white/40 blur-xl" />
                                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[#2856d5]/10 blur-xl" />

                                    {/* Chip */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 mb-3">
                                        <span className="text-[#2856d5] text-xs">⭐</span>
                                        <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-600">
                                            Đánh giá tổng quan
                                        </span>
                                    </div>

                                    {/* Rating header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-[34px] font-extrabold text-slate-900 leading-none">
                                                    {avgRating.toFixed(1)}
                                                </span>
                                                <span className="text-sm text-slate-500 mb-1">/5</span>
                                            </div>

                                            <Rate
                                                disabled
                                                allowHalf
                                                value={avgRating}
                                                className="text-[16px] mt-1"
                                            />

                                            <p className="text-[12px] text-slate-600 mt-1">
                                                Dựa trên{" "}
                                                <span className="font-semibold text-slate-900">
                                                    {reviews.length} đánh giá
                                                </span>
                                            </p>
                                        </div>

                                        {/* Trust badge */}
                                        <div className="flex flex-col items-end">
                                            <span className="text-[11px] text-slate-500 mb-1">
                                                Mức độ hài lòng
                                            </span>

                                            <div className="inline-flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-white shadow-sm text-[11px] font-medium text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Tin tưởng bởi người dùng
                                            </div>
                                        </div>
                                    </div>

                                    {/* Star bars */}
                                    <div className="space-y-1.5 mt-2">
                                        {ratingBuckets.map(({ star, count }) => {
                                            const percent = (count / totalReviews) * 100;
                                            return (
                                                <div key={star} className="flex items-center gap-2 text-[12px]">
                                                    <span className="w-10 text-slate-600">{star} Sao</span>

                                                    <div className="flex-1 h-1.5 rounded-full bg-white/60 border border-white overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#f97316]"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>

                                                    <span className="w-4 text-right text-slate-600">{count || ""}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* CAROUSEL (phải) */}
                            <div className="flex-1 min-w-0 flex items-stretch">
                                <div className="relative w-full">
                                    <Carousel {...carouselSettings} className="pb-6">
                                        {sortedReviews.map((r, index) => (
                                            <div key={r.id || index} className="px-1 h-full">
                                                <ReviewCard review={r} />
                                            </div>
                                        ))}
                                    </Carousel>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </ConfigProvider>
    );
}

// === SUB COMPONENTS ===

function getReviewTitle(rating) {
    if (rating >= 5) return "Tuyệt vời!";
    if (rating >= 4) return "Hài lòng";
    if (rating >= 3) return "Trải nghiệm tốt";
    return "Đánh giá từ khách hàng";
}
function ReviewCard({ review }) {
    const rating = review.rating || 0;
    const title = getReviewTitle(rating);

    return (
        <div
            className="
                relative
                bg-white
                rounded-2xl
                border border-slate-100
                shadow-[0_6px_18px_rgba(15,23,42,0.06)]
                hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]
                hover:-translate-y-0.5
                transition-all duration-300
                overflow-hidden
                group
            "
        >
            {/* Thanh gradient trên */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2856d5] via-[#4f8bff] to-[#22c55e]" />

            {/* Quote trang trí */}
            <div className="absolute -right-1 -bottom-4 text-6xl text-[#2856d5]/5 group-hover:text-[#2856d5]/10 transition-colors select-none leading-none">
                “
            </div>

            <div className="px-5 pt-4 pb-4 flex flex-col gap-3 relative z-[1] min-h-[190px]">
                {/* Header: avatar + info + badge rating */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                            size={42}
                            icon={<UserOutlined />}
                            className="bg-blue-50 text-[#2856d5] border border-blue-100 flex-shrink-0"
                            src={review.avatarUrl}
                        />

                        <div className="min-w-0">
                            <h4 className="font-semibold text-slate-900 text-[14px] leading-tight truncate">
                                {review.name || "Người dùng ẩn danh"}
                            </h4>

                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {review.date || "Mới đây"} ·{" "}
                                <span className="text-[#2856d5] font-medium">
                                    {title}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Badge rating */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eef3ff] border border-[#dbe5ff]">
                        <StarFilled className="text-[12px] text-[#fbbf24]" />
                        <span className="text-[12px] font-semibold text-slate-800 leading-none">
                            {rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-none">/5</span>
                    </div>
                </div>

                {/* Rating + title + content */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Rate
                            disabled
                            allowHalf
                            value={rating}
                            className="text-[13px]"
                        />
                        <span className="text-[11px] text-slate-400">
                            {rating.toFixed(1)} điểm · {title}
                        </span>
                    </div>

                    <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-4">
                        “{review.comment ?? review.content}”
                    </p>
                </div>

                {/* Footer: đã xác thực */}
                <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                        Đánh giá cho{" "}
                        <span className="font-medium text-slate-600">
                            N2RealEstate
                        </span>
                    </span>

                    <span
                        className="
                            inline-flex items-center gap-1.5
                            text-[11px] font-medium 
                            text-emerald-700 bg-emerald-50
                            px-2.5 py-0.5 rounded-full
                            border border-emerald-100
                        "
                    >
                        <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                            <path
                                d="M8.33325 2.5L3.74992 7.08333L1.66659 5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Đã xác thực
                    </span>
                </div>
            </div>
        </div>
    );
}


function EmptyState() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md px-8 py-10 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3ff] border border-[#d9e4ff] mb-5">
                <StarFilled className="text-2xl text-[#2856d5]" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-900 mb-2">
                Hiện tại vẫn chưa có bài đánh giá nào
            </h3>
            <p className="text-[14px] text-slate-600 max-w-md mx-auto">
                Hãy là người đầu tiên chia sẻ trải nghiệm của bạn với{" "}
                <span className="font-semibold text-[#2856d5]">N2RealEstate.vn</span>.
            </p>
        </div>
    );
}
