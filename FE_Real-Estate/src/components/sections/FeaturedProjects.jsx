import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProjectCard from "../cards/ProjectCard";
import { fetchPropertiesThunk } from "@/store/propertySlice";

/* =================== Skeleton =================== */
function SkeletonBlock({ className = "" }) {
    return <div className={`skeleton bg-gray-200 ${className}`} />;
}

function ProjectCardSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <SkeletonBlock className="w-full h-[180px]" />
            <div className="p-3">
                <SkeletonBlock className="h-5 w-3/4 rounded" />
                <SkeletonBlock className="mt-2 h-4 w-2/3 rounded" />
            </div>
        </div>
    );
}

/* =================== Component =================== */
export default function FeaturedProjects() {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const dispatch = useDispatch();
    const { list: allProperties, loading, error } = useSelector((s) => s.property);

    // Giữ skeleton ít nhất 1.5s cho tự nhiên
    const [minDelayDone, setMinDelayDone] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setMinDelayDone(true), 1500);
        return () => clearTimeout(t);
    }, []);

    // Gọi API khi mount
    useEffect(() => {
        if (!allProperties || allProperties.length === 0) {
            dispatch(fetchPropertiesThunk());
        }
    }, [dispatch, allProperties]);

    // Lọc dự án nổi bật (PREMIUM hoặc VIP)
    const featuredProjects = useMemo(() => {
        if (!Array.isArray(allProperties)) return [];
        const premiumAndVip = allProperties.filter((p) => {
            const type = p.listingType?.toUpperCase();
            return type === "PREMIUM" || type === "VIP";
        });
        const map = new Map();
        premiumAndVip.forEach((p) => {
            if (p.addressMain && !map.has(p.addressMain)) {
                map.set(p.addressMain, p);
            }
        });
        return Array.from(map.values());
    }, [allProperties]);

    const onInit = useCallback((swiper) => {
        if (!prevRef.current || !nextRef.current) return;
        swiper.params.navigation.prevEl = prevRef.current;
        swiper.params.navigation.nextEl = nextRef.current;
        swiper.navigation.init();
        swiper.navigation.update();
    }, []);

    const hasData = featuredProjects.length > 0;
    const showSkeleton = loading || !minDelayDone || !hasData;

    if (error) {
        return <div className="mt-12 text-center text-red-500">Không thể tải dự án.</div>;
    }

    if (!showSkeleton && featuredProjects.length === 0) return null;

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-[#1b2a57]">Dự án nổi bật</h2>
                <a href="/du-an" className="text-[#1f5fbf] font-semibold hover:underline">
                    Tất cả
                </a>
            </div>

            <div className="relative overflow-visible">
                {/* Nút Prev */}
                <button
                    ref={prevRef}
                    type="button"
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50 items-center justify-center"
                    aria-label="Prev"
                >
                    ‹
                </button>

                {/* Nút Next */}
                <button
                    ref={nextRef}
                    type="button"
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-11 h-11 rounded-full bg-white shadow border hover:bg-gray-50 items-center justify-center"
                    aria-label="Next"
                >
                    ›
                </button>

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
                    className="!px-1"
                >
                    {(showSkeleton ? Array.from({ length: 4 }) : featuredProjects).map((p, i) => (
                        <SwiperSlide key={showSkeleton ? `sk-${i}` : `project-${p.id}`}>
                            {showSkeleton ? (
                                <ProjectCardSkeleton />
                            ) : (
                                <div className="">
                                    <ProjectCard
                                        project={{
                                            id: p.id,
                                            name: p.title,
                                            address: p.addressMain,
                                            image: p.image,
                                        }}
                                    />
                                </div>
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
