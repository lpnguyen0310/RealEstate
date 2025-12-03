import React, { useMemo } from "react";
import { Carousel, Rate, Avatar, ConfigProvider } from "antd";
import { UserOutlined, StarFilled, LeftOutlined, RightOutlined } from "@ant-design/icons";

// Nút điều hướng custom cho Carousel
const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <button
        {...props}
        className={
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#2856d5] hover:border-[#2856d5] transition-all " +
            (currentSlide === 0 ? " opacity-40 cursor-not-allowed" : "")
        }
        aria-hidden="true"
        aria-disabled={currentSlide === 0}
    >
        <LeftOutlined style={{ fontSize: 13 }} />
    </button>
);

const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <button
        {...props}
        className={
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#2856d5] hover:border-[#2856d5] transition-all " +
            (currentSlide === slideCount - 1 ? " opacity-40 cursor-not-allowed" : "")
        }
        aria-hidden="true"
        aria-disabled={currentSlide === slideCount - 1}
    >
        <RightOutlined style={{ fontSize: 13 }} />
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
                            <span className="text-[#2856d5]">Radanhadat</span>?
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
                            {/* STATS (trái) */}
                            <div className="w-full lg:w-[38%] flex-shrink-0 flex flex-col justify-between">
                                <div>
                                    {/* phần trên giống hình bạn gửi */}
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-none">
                                                    {avgRating.toFixed(1)}
                                                </span>
                                                <span className="text-sm text-slate-400 mb-1">
                                                    /5
                                                </span>
                                            </div>
                                            <Rate
                                                disabled
                                                allowHalf
                                                value={avgRating}
                                                className="mt-2 text-[16px]"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {reviews.length} đánh giá & phản hồi
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                Dữ liệu từ người dùng thực sau khi giao dịch hoặc sử dụng
                                                các tính năng trên nền tảng.
                                            </p>
                                        </div>
                                    </div>

                                    {/* thanh sao 5→1, màu cam */}
                                    <div className="space-y-2.5">
                                        {ratingBuckets.map(({ star, count }) => {
                                            const percent = (count / totalReviews) * 100;
                                            return (
                                                <div
                                                    key={star}
                                                    className="flex items-center gap-3 text-[13px]"
                                                >
                                                    <span className="w-12 text-[12px] text-slate-500">
                                                        {star} Sao
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-amber-400 transition-[width] duration-300 ease-out"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-5 text-right text-[12px] text-slate-500">
                                                        {count || ""}
                                                    </span>
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
    return (
        <div className="h-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200 px-6 py-6 flex flex-col justify-between min-h-[260px]">
            <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <Avatar
                        size={48}
                        icon={<UserOutlined />}
                        className="bg-blue-50 text-[#2856d5] border border-blue-100 flex-shrink-0"
                        src={review.avatarUrl}
                    />
                    <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 text-[15px] truncate">
                            {review.name || "Người dùng ẩn danh"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Rate
                                disabled
                                allowHalf
                                value={review.rating}
                                className="text-[13px]"
                            />
                            <span className="text-[12px] text-slate-400">
                                {review.rating ? review.rating.toFixed(1) : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h5 className="font-semibold text-slate-800 text-[14px] mb-2">
                    {getReviewTitle(review.rating || 0)}
                </h5>
                <p className="text-slate-600 text-[14px] leading-relaxed line-clamp-4">
                    “{review.comment ?? review.content}”
                </p>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-slate-400">
                    {review.date || "Mới đây"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <svg
                        width="11"
                        height="11"
                        viewBox="0 0 10 10"
                        fill="none"
                        className="stroke-current"
                    >
                        <path
                            d="M8.33325 2.5L3.74992 7.08333L1.66659 5"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Đã xác thực
                </span>
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
                <span className="font-semibold text-[#2856d5]">Radanhadat.vn</span>.
            </p>
        </div>
    );
}
