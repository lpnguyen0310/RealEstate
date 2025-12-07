// src/components/cards/SimilarNews.jsx
import { useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigation, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./skeletion/PropertyCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { fetchPropertiesThunk } from "@/store/propertySlice";

const MIN_SKELETON_MS = 2000; // Giữ skeleton tối thiểu 2s

export default function SimilarNews() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const dispatch = useDispatch();

  // ✅ đọc đúng bucket theo slot
  const {
    similarNewsList,
    similarNewsLoading,
    similarNewsError,
  } = useSelector((s) => s.property);

  // Min delay cho skeleton
  const [minDelayDone, setMinDelayDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), MIN_SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Chỉ lấy tin đã duyệt
    dispatch(
      fetchPropertiesThunk({
        page: 0,
        size: 8,
        status: "PUBLISHED",
        ensurePublished: true,
        sort: "postedAt,DESC",
        slot: "similarNews", // ✅ quan trọng: ghi vào bucket riêng
      })
    );
  }, [dispatch]);

  const handleInit = useCallback((swiper) => {
    if (!prevRef.current || !nextRef.current) return;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  const hasData = Array.isArray(similarNewsList) && similarNewsList.length > 0;
  const skeletonCount = 8;

  // Ẩn skeleton chỉ khi có data + đã qua minDelay, hoặc hết loading
  const showSkeleton = similarNewsLoading || !(hasData && minDelayDone);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1b2a57]">Bất động sản nổi bật</h2>
        <Link 
          to="/search?sort=postedAt,desc" 
          className="text-[#1f5fbf] font-semibold hover:underline"
        >
          Tất cả
        </Link>
      </div>

      {/* Hiện lỗi nếu không có data và đã qua min delay */}
      {similarNewsError && !hasData && minDelayDone && (
        <div className="mt-4 text-center text-red-500">Lỗi: {similarNewsError}</div>
      )}

      <div className="relative">
        <button
          ref={prevRef}
          type="button"
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border hover:bg-gray-50"
        >
          ‹
        </button>
        <button
          ref={nextRef}
          type="button"
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border hover:bg-gray-50"
        >
          ›
        </button>

        <Swiper
          modules={[Navigation, Autoplay]}
          onInit={handleInit}
          slidesPerView={1.1}
          spaceBetween={16}
          loop
          grabCursor
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="!px-2"
        >
          {(showSkeleton ? Array.from({ length: skeletonCount }) : similarNewsList).map((item, i) => (
            <SwiperSlide key={showSkeleton ? `sk-${i}` : item.id}>
              {showSkeleton ? (
                <PropertyCardSkeleton />
              ) : (
                <Link to={`/real-estate/${item.id}`} className="block group">
                  <PropertyCard item={item} />
                </Link>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
