import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigation, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import PropertyCard from "./PropertyCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { fetchPropertiesThunk } from "@/store/propertySlice";

import { FEATURED_PROPERTIES } from "../../data/featuredProperties";

export default function SimilarNews() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // === BƯỚC 1: KẾT NỐI REDUX ===
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.property);
  console.log("SimilarNews - list:", list, "loading:", loading, "error:", error);

  // === BƯỚC 2: GỌI API KHI COMPONENT TẢI LẦN ĐẦU ===
  useEffect(() => {
      // Gọi thunk để lấy dữ liệu, ví dụ lấy 8 tin đầu tiên
      dispatch(fetchPropertiesThunk({ page: 0, size: 8 }));
  }, [dispatch]); // Dependency là dispatch để chỉ chạy 1 lần

  const handleInit = useCallback((swiper) => {
    if (!prevRef.current || !nextRef.current) return;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  if (loading) {
      return <div className="mt-10 text-center">Đang tải các tin tương tự...</div>;
  }

  if (error) {
      return <div className="mt-10 text-center text-red-500">Lỗi: {error}</div>;
  }

  if (!loading && list.length === 0) {
        return null;
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#1b2a57]">Các tin tương tự</h2>
        <a href="/bat-dong-san-noi-bat" className="text-[#1f5fbf] font-semibold">Tất cả</a>
      </div>

      <div className="relative">
        <button ref={prevRef} type="button"
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border hover:bg-gray-50">‹</button>
        <button ref={nextRef} type="button"
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border hover:bg-gray-50">›</button>

        <Swiper
          modules={[Navigation, Autoplay]}
          onInit={handleInit}
          slidesPerView={1.1}
          spaceBetween={16}
          loop
          grabCursor
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640:  { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="!px-2"
        >
          {list.map((p) => (
            <SwiperSlide key={p.id}>
              <Link to={`/real-estate/${p.id}`} className="block group">
                <PropertyCard item={p} />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
