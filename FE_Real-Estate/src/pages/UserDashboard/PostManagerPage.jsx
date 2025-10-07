import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
const SLIDES = [
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400",
];
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function PostManagerPage() {
    const navigate = useNavigate();

    // ✅ định nghĩa hàm handleSearch
    const handleSearch = useCallback((filters) => {
        console.log("filters:", filters);
        // TODO: gọi API lấy danh sách tin theo filters
        // ví dụ:
        // fetch(`/api/posts?code=${filters.code || ""}&area=${filters.area || ""}`)
        //  .then(r => r.json()).then(setRows);
    }, []);


    return (
        <div>
            {/* Banner */}
            {/* ===== HERO / BANNER ===== */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1B264F] to-[#1D5DCB] py-5 md:py-6 px-6 md:px-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between">
                {/* Text bên trái */}
                <div className="flex-1 max-w-[540px] space-y-3">
                    <h2 className="text-[26px] font-bold">Radanhadat.vn</h2>
                    <h3 className="text-[20px] font-semibold">
                        Nền tảng Đăng tin Bất động sản Thế hệ mới
                    </h3>
                    <p className="text-gray-200 leading-relaxed">
                        Đăng tin tìm kiếm khách hàng, quản lý danh mục bất động sản, gợi ý
                        thông minh giỏ hàng phù hợp cho khách hàng mục tiêu.
                    </p>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="mt-2 bg-[#FFD43B] text-[#1B264F] font-semibold hover:bg-[#ffe480] border-none"
                    >
                        Đăng tin mới
                    </Button>
                </div>

                {/* Slider bên phải */}
                <div className="flex-1 w-full mt-6 md:mt-0 md:ml-10 max-w-[720px]">
                    <Swiper
                        modules={[Pagination, Autoplay]}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 3000 }}
                        loop
                        className="rounded-xl overflow-hidden"
                    >
                        {SLIDES.map((src, i) => (
                            <SwiperSlide key={i}>
                                <img
                                    src={src}
                                    alt={`slide-${i + 1}`}
                                    className="w-full h-[260px] md:h-[300px] object-cover rounded-xl"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
            {/* ===== FILTERS BAR ===== */}


            {/* ===== BODY (để sau này thêm danh sách tin đăng) ===== */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center text-gray-500">
                (Nội dung quản lý tin đăng sẽ hiển thị tại đây)
            </div>

        </div>
    );
}
