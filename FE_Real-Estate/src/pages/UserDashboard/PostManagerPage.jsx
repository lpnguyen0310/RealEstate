import { Button } from "antd";
import { useEffect, useState, useMemo } from "react"; // Keep useMemo if other parts need it, but not for counts
import { PlusOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchMyPropertiesThunk,
    fetchMyPropertyCountsThunk, // <-- Import the counts thunk
    setPage,
    setSize,
} from "@/store/propertySlice"; // Adjust path if needed
import {
    PostFilters,
    PostStatusTabs,
    PostCreateDrawer,
    PostList,
} from "@/components/dashboard/postmanagement"; // Adjust path if needed

const SLIDES = [
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400",
];

export default function PostManagerPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useOutletContext() || {};

    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get("tab");

    // Select all necessary state including 'counts'
    const { list, page, size, totalElements, loading, error, counts } = useSelector(
        (s) => s.property
    );

    // Initialize status based on URL or default to 'active'
    const [status, setStatus] = useState(urlTab || "active");
    const [openCreate, setOpenCreate] = useState(false);

    // Effect 1: Fetch the list based on the current status, page, and size
    useEffect(() => {
        if (status) {
            dispatch(fetchMyPropertiesThunk({ page, size, status: status }));
        }
    }, [dispatch, page, size, status]); // Re-run when status, page, or size changes

    // Effect 2: Fetch the counts once when the component mounts
    useEffect(() => {
        dispatch(fetchMyPropertyCountsThunk());
    }, [dispatch]); // Runs only once

    // Remove the old useMemo that calculated counts locally
    // const counts = useMemo(() => { ... }); // DELETE THIS

    return (
        <div>
            {/* Banner Section */}
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

            {/* Filters Bar */}
            <PostFilters
                onSearch={(filters) => console.log("search filters:", filters)}
                onCreate={() => setOpenCreate(true)}
            />

            {/* Status Tabs */}
            <div className="mt-4 bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] px-3 py-3">
                <PostStatusTabs
                    activeKey={status}
                    onChange={(newStatus) => {
                        // Update local state
                        setStatus(newStatus);
                        // Reset pagination to page 1
                        dispatch(setPage(0));
                        // Update URL search params
                        if (newStatus === 'active') {
                            setSearchParams({}, { replace: true }); // Remove ?tab for default
                        } else {
                            setSearchParams({ tab: newStatus }, { replace: true });
                        }
                    }}
                    counts={counts} // Use counts from Redux state
                />
            </div>

            {/* Post List + Pagination */}
            <div className="mt-4">
                {loading ? (
                    <div className="p-6 bg-white rounded-2xl border text-center text-gray-500">Đang tải danh sách...</div>
                ) : error ? (
                    <div className="p-6 bg-white rounded-2xl border text-red-500">
                        Lỗi: {error}
                    </div>
                ) : (
                    <PostList
                        items={list} // Display the list fetched for the current status
                        total={totalElements} // Total items for the current status (used by pagination)
                        page={page + 1} // Antd pagination starts from 1
                        pageSize={size}
                        onPageChange={(p) => dispatch(setPage(p - 1))} // Dispatch page change (0-based)
                        onPageSizeChange={(n) => dispatch(setSize(n))} // Dispatch size change
                    />
                )}
            </div>

            {/* Create Post Drawer */}
            <PostCreateDrawer
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSaveDraft={(values) => {
                    console.log("SAVE DRAFT:", values);
                    // Add dispatch logic for saving draft if needed
                }}
                onContinue={(values) => {
                    console.log("CONTINUE:", values);
                    // Add logic if needed
                }}
                onCreated={() => {
                    setOpenCreate(false);
                    // Navigate to 'pending' tab after creation
                    setStatus("pending");
                    dispatch(setPage(0));
                    setSearchParams({ tab: 'pending' }, { replace: true });
                    // Re-fetch counts to update the numbers on tabs
                    dispatch(fetchMyPropertyCountsThunk());
                }}
                user={user} // Pass user data if needed by the drawer
            />
        </div>
    );
}