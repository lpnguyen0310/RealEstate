import { Button } from "antd";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMyPropertiesThunk,
    setPage,
    setSize,
} from "@/store/propertySlice";
import {
    PostFilters,
    PostStatusTabs,
    PostCreateDrawer,
    PostList,
} from "@/components/dashboard/postmanagement";

// Banner slides
const SLIDES = [
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400",
];

// Map tiếng Việt -> key tab
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
    const dispatch = useDispatch();
    const { user } = useOutletContext() || {};

    const { list, page, size, totalElements, loading, error } = useSelector(
        (s) => s.property
    );

    // Tab trạng thái (UI thôi, BE chưa filter theo trạng thái)
    const [status, setStatus] = useState("active");
    const [openCreate, setOpenCreate] = useState(false);

    // Fetch dữ liệu từ BE mỗi khi page/size đổi
    useEffect(() => {
        dispatch(fetchMyPropertiesThunk({ page, size }));
    }, [dispatch, page, size]);

    const handlePageChange = (p) => dispatch(setPage(p - 1));
    const handlePageSizeChange = (n) => dispatch(setSize(n));
    const filtered = useMemo(() => {
        return list.filter(it => it.statusKey === status);
    }, [list, status]);

    // Đếm số tin theo trạng thái (nếu muốn hiển thị tab số lượng)
    const counts = useMemo(() => {
        const base = { active: 0, pending: 0, draft: 0, rejected: 0, hidden: 0, expired: 0, expiringSoon: 0 };
        for (const it of list) {
            if (base[it.statusKey] !== undefined) base[it.statusKey]++;
        }
        return base;
    }, [list]);

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

            {/* ===== FILTERS BAR ===== */}
            <PostFilters
                onSearch={(filters) => console.log("search filters:", filters)}
                onCreate={() => setOpenCreate(true)}
            />

            {/* ===== STATUS TABS ===== */}
            <div className="mt-4 bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] px-3 py-3">
                <PostStatusTabs
                    activeKey={status}
                    onChange={setStatus}
                    counts={counts}
                />
            </div>

            {/* ===== LIST + PAGINATION ===== */}
            <div className="mt-4">
                {loading ? (
                    <div className="p-6 bg-white rounded-2xl border">Đang tải...</div>
                ) : error ? (
                    <div className="p-6 bg-white rounded-2xl border text-red-500">
                        Lỗi: {error}
                    </div>
                ) : (
                    <PostList
                        items={filtered}               
                        total={filtered.length}         
                        page={page + 1}              
                        pageSize={size}
                        onPageChange={(p) => dispatch(setPage(p - 1))}
                        onPageSizeChange={(n) => dispatch(setSize(n))}
                    />
                )}
            </div>

            {/* === Drawer Tạo Tin === */}
            <PostCreateDrawer
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSaveDraft={(values) => {
                    console.log("SAVE DRAFT:", values);
                }}
                onContinue={(values) => {
                    console.log("CONTINUE:", values);
                }}
                onCreated={() => {
                    setOpenCreate(false);                // đóng Drawer
                    dispatch(setPage(0));                // về trang 1 (tuỳ bạn)
                    dispatch(fetchMyPropertiesThunk({ page: 0, size })); // reload danh sách
                }}
                user={user}
            />
        </div>
    );
}
