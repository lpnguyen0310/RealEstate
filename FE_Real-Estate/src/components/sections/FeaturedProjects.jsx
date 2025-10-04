// src/components/sections/FeaturedProjects.jsx
import { useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProjectCard from "../cards/ProjectCard";
import { FEATURED_PROJECTS } from "../../data/featuredProjects";

export default function FeaturedProjects() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const onInit = useCallback((swiper) => {
    if (!prevRef.current || !nextRef.current) return;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold text-[#1b2a57]">Dự án nổi bật</h2>
        <a href="/du-an" className="text-[#1f5fbf] font-semibold hover:underline">Tất cả</a>
      </div>

      {/* Cho phép nút lòi ra ngoài mà không ảnh hưởng layout */}
      <div className="relative overflow-visible">

        {/* Prev: nửa ngoài mép trái */}
        <button
          ref={prevRef}
          type="button"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20
                     w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50
                     items-center justify-center"
          aria-label="Prev"
        >‹</button>

        {/* Next: nửa ngoài mép phải */}
        <button
          ref={nextRef}
          type="button"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20
                     w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50
                     items-center justify-center"
          aria-label="Next"
        >›</button>

        <Swiper
          modules={[Navigation]}
          onInit={onInit}
          slidesPerView={1.05}
          spaceBetween={18}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 28 },
          }}
          // Không thêm padding trái/phải cho Swiper để nút không “đẩy” nội dung
          className=""
        >
          {FEATURED_PROJECTS.map((p) => (
            <SwiperSlide key={p.id}>
              <ProjectCard project={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
