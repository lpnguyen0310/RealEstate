import { useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import PropertyCard from "./PropertyCard";

import { FEATURED_PROPERTIES } from "../../data/featuredProperties";

export default function SimilarNews() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const handleInit = useCallback((swiper) => {
    if (!prevRef.current || !nextRef.current) return;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

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
          {FEATURED_PROPERTIES.map((p) => (
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
