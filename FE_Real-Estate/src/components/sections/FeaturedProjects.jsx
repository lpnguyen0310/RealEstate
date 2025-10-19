// src/components/sections/FeaturedProjects.jsx
import { useRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProjectCard from "../cards/ProjectCard";
import { fetchPropertiesThunk } from "@/store/propertySlice"; // Chỉnh lại đường dẫn tới slice của bạn

export default function FeaturedProjects() {
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    // 1. Kết nối Redux
    const dispatch = useDispatch();
    const { list: allProperties, loading, error } = useSelector((state) => state.property);
console.log("1. Dữ liệu gốc từ Redux:", allProperties);
    // 2. Gọi API để lấy danh sách tất cả properties khi component được tải
    useEffect(() => {
        // Chỉ gọi API nếu trong store chưa có dữ liệu
        if (!allProperties || allProperties.length === 0) {
            dispatch(fetchPropertiesThunk());
        }
    }, [dispatch, allProperties]);

    // 3. Lọc và nhóm dữ liệu để tạo danh sách "Dự án nổi bật" độc nhất
    const featuredProjects = useMemo(() => {
        if (!allProperties || allProperties.length === 0) {
            return [];
        }

        // 1. Lọc ra các tin PREMIUM và VIP (SỬA LẠI TÊN THUỘC TÍNH Ở ĐÂY)
        const premiumAndVip = allProperties.filter(p => {
            const type = p.listingType?.toUpperCase(); // Dùng `listingType` (camelCase)
            return type === 'PREMIUM' || type === 'VIP';
        });

        // 2. Nhóm và lấy đại diện duy nhất (dùng `addressMain`)
        const uniqueProjectsMap = new Map();
        premiumAndVip.forEach(p => {
            if (p.addressMain && !uniqueProjectsMap.has(p.addressMain)) {
                uniqueProjectsMap.set(p.addressMain, p);
            }
        });

        // 3. Chuyển Map thành mảng để render
        return Array.from(uniqueProjectsMap.values());

    }, [allProperties]);
    const onInit = useCallback((swiper) => {
        if (!prevRef.current || !nextRef.current) return;
        swiper.params.navigation.prevEl = prevRef.current;
        swiper.params.navigation.nextEl = nextRef.current;
        swiper.navigation.init();
        swiper.navigation.update();
    }, []);

    // 4. Xử lý các trạng thái giao diện
    if (loading && featuredProjects.length === 0) {
        return <div className="mt-12 text-center">Đang tải dự án nổi bật...</div>;
    }

    if (error) {
        return <div className="mt-12 text-center text-red-500">Không thể tải dự án.</div>;
    }
    
    // Nếu không có dự án nào thỏa mãn điều kiện, không hiển thị section này
    if (featuredProjects.length === 0) {
        return null;
    }

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-[#1b2a57]">Dự án nổi bật</h2>
                <a href="/du-an" className="text-[#1f5fbf] font-semibold hover:underline">Tất cả</a>
            </div>

            <div className="relative overflow-visible">
                {/* Nút Prev */}
                <button
                    ref={prevRef}
                    type="button"
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50 items-center justify-center"
                    aria-label="Prev"
                >‹</button>

                {/* Nút Next */}
                <button
                    ref={nextRef}
                    type="button"
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50 items-center justify-center"
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
                    className=""
                >
                    {/* 5. Render danh sách `featuredProjects` đã được lọc */}
                    {featuredProjects.map((p) => (
                        <SwiperSlide key={`project-${p.id}`}>
                            {/* Map lại dữ liệu từ `property` sang cấu trúc mà `ProjectCard` cần */}
                            <ProjectCard project={{
                                id: p.id,
                                name: p.title,
                                address: p.addressMain, // Dùng addressShort cho ngắn gọn
                                image: p.image,
                            }} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}