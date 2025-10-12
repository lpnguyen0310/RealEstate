import { Button } from "antd";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useOutletContext } from "react-router-dom"; // +++

const SLIDES = [
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400",
];

import { useNavigate } from "react-router-dom";
import { PostFilters, PostStatusTabs, PostCreateDrawer, PostList } from "../../components/dashboard/postmanagement";
import { MOCK_POSTS } from "@/data/PostManagementData/mockPost";

// map statusTag (VN) -> key của tab
const tagToKey = (tag) => {
    switch (tag) {
        case "Đang Đăng": return "active";
        case "Chờ Duyệt": return "pending";
        case "Nháp": return "draft";
        case "Bị Từ Chối": return "rejected";
        case "Đã Ẩn": return "hidden";
        case "Hết Hạn": return "expired";
        case "Sắp Hết Hạn": return "expiringSoon";
        default: return undefined;
    }
};

export default function PostManagerPage() {
    const navigate = useNavigate();
    const { user } = useOutletContext() || {};
    const [status, setStatus] = useState("active");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [openCreate, setOpenCreate] = useState(false);

    // danh sách sau khi lọc theo form ===
    const [filteredPosts, setFilteredPosts] = useState(MOCK_POSTS);

    // ounts tổng theo toàn bộ data 
    const counts = useMemo(() => {
        const base = { active: 0, pending: 0, draft: 0, rejected: 0, hidden: 0, expired: 0, expiringSoon: 0 };
        for (const it of MOCK_POSTS) {
            const k = tagToKey(it.statusTag);
            if (k && base[k] !== undefined) base[k]++;
        }
        return base;
    }, []);

    // lọc theo tab đang chọn từ danh sách đã qua search 
    const listByTab = useMemo(
        () => filteredPosts.filter((it) => tagToKey(it.statusTag) === status),
        [filteredPosts, status]
    );

    const totalAfterFilter = listByTab.length;

    // phân trang client-side 
    const pagedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return listByTab.slice(start, start + pageSize);
    }, [listByTab, page, pageSize]);

    useEffect(() => setPage(1), [status]);
    const handlePageSizeChange = (n) => { setPageSize(n); setPage(1); };

    // === nhận filters từ PostFilters và lọc MOCK_POSTS ===
    const handleSearch = useCallback((filters) => {
        let result = [...MOCK_POSTS];

        if (filters.code) {
            const q = filters.code.toLowerCase();
            result = result.filter(p => p.code?.toLowerCase().includes(q));
        }

        if (filters.area) {
            result = result.filter(p => p.areaCode === filters.area);
        }

        if (filters.areaMin !== undefined) {
            result = result.filter(p => Number(p.area) >= Number(filters.areaMin));
        }
        if (filters.areaMax !== undefined) {
            result = result.filter(p => Number(p.area) <= Number(filters.areaMax));
        }

        if (filters.priceMin !== undefined) {
            result = result.filter(p => Number(p.price) >= Number(filters.priceMin));
        }
        if (filters.priceMax !== undefined) {
            result = result.filter(p => Number(p.price) <= Number(filters.priceMax));
        }

        if (filters.expireDate) {
            // cả hai đều ở định dạng YYYY-MM-DD -> so sánh string an toàn
            result = result.filter(p => (p.expireDate || "") >= filters.expireDate);
        }

        setFilteredPosts(result);
        setPage(1);
    }, []);

    return (
        <div>
            {/* ===== HERO / BANNER ===== */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1B264F] to-[#1D5DCB] py-5 md:py-6 px-6 md:px-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between">
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
                        onClick={() => navigate("/dashboard/posts/new")}
                    >
                        Đăng tin mới
                    </Button>
                </div>

                <div className="flex-1 w-full mt-6 md:mt-0 md:ml-10 max-w-[720px]">
                    <Swiper
                        modules={[SwiperPagination, Autoplay]}
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

            {/* FILTERS BAR */}
            <PostFilters
                onSearch={handleSearch}
                onCreate={() => setOpenCreate(true)}
            />

            {/* STATUS TABS */}
            <div className="mt-4 bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] px-3 py-3">
                <PostStatusTabs
                    activeKey={status}
                    onChange={setStatus}
                    counts={counts}
                />
            </div>

            {/* LIST + PAGINATION (sau lọc + theo tab) */}
            <div className="mt-4">
                <PostList
                    items={pagedItems}
                    total={totalAfterFilter}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {/* === Drawer Tạo Tin === */}
            <PostCreateDrawer
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSaveDraft={(values) => {
                    console.log("SAVE DRAFT:", values);
                    // TODO: gọi API lưu nháp -> đóng hoặc giữ mở tuỳ UX
                }}
                onContinue={(values) => {
                    console.log("CONTINUE:", values);
                    // TODO: chuyển bước tiếp theo (upload ảnh, vị trí bản đồ, tiện ích, ...),
                    // hoặc navigate(`/dashboard/posts/new?prefill=${...}`)
                }}
                user={user}
            />
        </div>
    );
}
