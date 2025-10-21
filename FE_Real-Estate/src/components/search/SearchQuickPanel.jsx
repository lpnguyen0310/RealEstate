import { useRef } from "react";
import { Tag } from "antd";
import {
    CompassOutlined,
    ClusterOutlined,
    RightOutlined,
    LeftOutlined,
} from "@ant-design/icons";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

function RowItem({ icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-[#e9eff8]/60 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-[#98b3f5] focus:ring-offset-0"
        >
            <div className="flex items-center gap-3 text-gray-900">
                {icon}
                <span className="text-[16px] font-medium">{label}</span>
            </div>
            <RightOutlined className="text-gray-500" />
        </button>
    );
}

export default function SearchQuickPanel({
    trending = [],
    onPickTrending,
    onPickMetro,
    onPickArea,
    onPickTravelTime,
}) {
    const swiperRef = useRef(null);

    return (
        <div className="w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* ===== Xu hướng tìm kiếm ===== */}
            <div className="p-6 pb-2">
                <div className="text-gray-900 font-semibold text-[18px] mb-3">
                    Xu hướng tìm kiếm
                </div>

                <div className="relative">
                    {/* Nút điều hướng trái */}
                    <button
                        type="button"
                        aria-label="prev"
                        onClick={() => swiperRef.current?.slidePrev()}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                        <LeftOutlined />
                    </button>

                    {/* Nút điều hướng phải */}
                    <button
                        type="button"
                        aria-label="next"
                        onClick={() => swiperRef.current?.slideNext()}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                        <RightOutlined />
                    </button>
                    <div className="px-12">
                        <Swiper
                            onSwiper={(s) => (swiperRef.current = s)}
                            slidesPerView={"auto"}
                            spaceBetween={12}
                            freeMode
                            grabCursor
                        >
                            {trending.map((t) => (
                                <SwiperSlide key={t.text} style={{ width: "auto" }}>
                                    <Tag
                                        onClick={() => onPickTrending?.(t)}
                                        className="cursor-pointer rounded-full px-3 py-2 bg-[#e8f2fb] hover:bg-[#dff0ff] border-none text-[#174ea6] shadow-[0_2px_10px_rgba(8,54,122,0.06)]"
                                    >
                                        <span className="mr-1">📈</span>
                                        <span className="font-medium">{t.text}</span>
                                    </Tag>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            <div className="px-6 pt-4 pb-6">
                <div className="text-gray-900 font-semibold text-[18px] mb-3">
                    Tìm kiếm theo
                </div>

                <div className="flex flex-col gap-3">
                    <RowItem
                        icon={<CompassOutlined className="text-[18px]" />}
                        label="Ga metro"
                        onClick={() => {
                            // Mở modal MetroPanel
                            window.dispatchEvent(new CustomEvent("open-metro-panel"));
                        }}
                    />
                    <RowItem
                        icon={<ClusterOutlined className="text-[18px]" />}
                        label="Khu vực"
                        onClick={onPickArea}
                    />
                </div>
            </div>
        </div>
    );
}
