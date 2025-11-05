// src/pages/dashboard/posts/PostManagerPage.jsx
import { Button } from "antd";
import { useEffect, useMemo, useState, useCallback } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    fetchMyPropertiesThunk,
    fetchMyPropertyCountsThunk,
    setPage,
    setSize,
    setPendingAction,  
    clearPendingAction, 
} from "@/store/propertySlice";

import {
    PostFilters,
    PostStatusTabs,
    PostCreateDrawer,
    PostList,
} from "@/components/dashboard/postmanagement";

import WarningModal from "@/components/dashboard/postmanagement/WarningModal.jsx";


const SLIDES = [
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400",
];

/* ----------------- helpers ----------------- */
const cleanObj = (obj) => {
    const out = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "" || Number.isNaN(v)) return;
        out[k] = v;
    });
    return out;
};
const parseNumber = (v) => (v == null ? undefined : (isNaN(+v) ? undefined : +v));

const parseFiltersFromSearch = (sp) => {
    const obj = Object.fromEntries(sp.entries());
    return cleanObj({
        q: obj.q,
        area: obj.area,
        areaMin: parseNumber(obj.areaMin),
        areaMax: parseNumber(obj.areaMax),
        priceMin: parseNumber(obj.priceMin),
        priceMax: parseNumber(obj.priceMax),
        expireDate: obj.expireDate,
    });
};

const buildSearchParams = ({ status, page, size, filters }) => {
    const base = cleanObj({
        tab: status && status !== "active" ? status : undefined,
        page: page > 0 ? page + 1 : 1, // URL 1-based
        size,
        ...cleanObj(filters),
    });
    return base;
};
/* ------------------------------------------- */

export default function PostManagerPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useOutletContext() || {};
    const [searchParams, setSearchParams] = useSearchParams();
    const [warningModal, setWarningModal] = useState({ open: false, message: "" });
    const [highlightedId, setHighlightedId] = useState(null);
    const [scrolledOnce, setScrolledOnce] = useState(false);

    const {
        list,
        page,
        size,
        totalElements,
        counts,
        pendingAction, 
        rawLoading
    } = useSelector((s) => ({
        list: s.property.myList,
        page: s.property.myPage,
        size: s.property.mySize,
        totalElements: s.property.myTotalElements,
        counts: s.property.counts,
        pendingAction: s.property.pendingAction, 
        rawLoading: s.property.loading,        
    }));

    // ---- local ui states ----
    const [status, setStatus] = useState(searchParams.get("tab") || "active");
    const [filters, setFilters] = useState(parseFiltersFromSearch(searchParams));
    const [openCreate, setOpenCreate] = useState(false);

    // 🆕 state để mở Drawer chi tiết theo ID
    const [editingId, setEditingId] = useState(null);

    const handleOpenWarning = useCallback((message) => {
        setWarningModal({ open: true, message: message || "" });
    }, []); // <-- Thêm mảng dependency rỗng []

    // Bọc luôn hàm này cho nhất quán
    const handleCloseWarning = useCallback(() => {
        setWarningModal({ open: false, message: "" });
    }, []); // <-- Thêm mảng dependency rỗng []

    /* ========== URL -> STATE ========== */
    useEffect(() => {
        const qp = Object.fromEntries(searchParams.entries());
        const warnId = qp.warnedPostId ? Number(qp.warnedPostId) : null;
        const viewId = qp.viewPostId ? Number(qp.viewPostId) : null;

        let urlStatus = qp.tab || "active";

        // 1. Kiểm tra và ghi sổ hành động chờ
        if (warnId) {
            dispatch(setPendingAction({ type: 'warn', postId: warnId }));
            urlStatus = 'warned'; // Ép chuyển sang tab 'warned'
        } else if (viewId) {
            dispatch(setPendingAction({ type: 'view', postId: viewId }));
            urlStatus = 'active'; // Ép chuyển sang tab 'active' (nơi bài đăng được duyệt)
        }

        // 2. Set state từ URL (hoặc từ giá trị đã ép)
        setStatus(urlStatus);
        setFilters(parseFiltersFromSearch(searchParams));

        const urlPage = parseNumber(qp.page) ?? 1;
        const urlSize = parseNumber(qp.size) ?? size;

        if (urlPage - 1 !== page) dispatch(setPage(Math.max(0, urlPage - 1)));
        if (urlSize !== size && urlSize != null) dispatch(setSize(urlSize));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, dispatch]);

    /* ========== XỬ LÝ HÀNH ĐỘNG CHỜ (Highlight / Mở Modal) ========== */
    useEffect(() => {
        // Guard 1: Phải có hành động
        if (!pendingAction) return;
        
        // Guard 2: Phải chờ list tải xong
        if (rawLoading || !list || list.length === 0) {
            return; // Chờ list tải xong
        }

        const { type, postId } = pendingAction;
        const post = list.find(p => p.id === postId);

        // Guard 3: Phải tìm thấy post
        if (!post) {
            console.warn(`Pending Action: Không tìm thấy Post #${postId} trong tab ${status}.`);
            dispatch(clearPendingAction()); // Xóa action
            return;
        }

        // Mọi thứ OK -> Thực thi hành động
        if (type === 'warn') {
            handleOpenWarning(post.latestWarningMessage);
        } else if (type === 'view') {
            setHighlightedId(post.id); // Kích hoạt highlight
        }

        // Dọn dẹp action
        dispatch(clearPendingAction());

        // Dọn dẹp URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("warnedPostId");
        newParams.delete("viewPostId");
        setSearchParams(newParams, { replace: true });

    }, [
        pendingAction,
        list,
        rawLoading, // <-- Lấy từ useSelector
        status,
        dispatch,
        handleOpenWarning,
        searchParams,
        setSearchParams
    ]);

    // Giữ lại logic timer để TẮT highlight
    useEffect(() => {
        if (!highlightedId) return;
        const highlightTimer = setTimeout(() => {
            setHighlightedId(null);
        }, 10000); // Giữ 10s của bạn
        return () => clearTimeout(highlightTimer);
    }, [highlightedId]);

    /* ========== STATE -> FETCH ========== */
    useEffect(() => {
        dispatch(fetchMyPropertiesThunk({ page, size, status, ...filters }));
    }, [dispatch, page, size, status, filters]);

    // Fetch counts (1 lần)
    useEffect(() => {
        dispatch(fetchMyPropertyCountsThunk());
    }, [dispatch]);


    /* ========== STATE -> URL ========== */
    const pushUrl = (next = {}) => {
        const params = buildSearchParams({
            status: next.status ?? status,
            page: next.page ?? page,
            size: next.size ?? size,
            filters: next.filters ?? filters,
        });
        setSearchParams(params, { replace: false });
    };

    const [delayedLoading, setDelayedLoading] = useState(false);

    useEffect(() => {
        if (rawLoading) {
            setDelayedLoading(true);
        } else {
            const t = setTimeout(() => setDelayedLoading(false), 2000);
            return () => clearTimeout(t);
        }
    }, [rawLoading]);

    // 🆕 mở Drawer chi tiết từ card
    const handleOpenDetail = (id) => {
        if (!id) return;
        console.log('Open detail id=', id)
        setEditingId(id);
        setOpenCreate(true);
    };

    // 🆕 đóng Drawer
    const handleCloseDrawer = () => {
        setOpenCreate(false);
        setEditingId(null);
    };

    const handleEndHighlight = useCallback(() => {
        setHighlightedId(null);
    }, []);
    

    return (
        <div>
            {/* Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1B264F] to-[#1D5DCB] py-5 md:py-6 px-6 md:px-8 text-white mb-8 flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 max-w-[540px] space-y-3">
                    <h2 className="text-[26px] font-bold">Badongsan.vn</h2>
                    <h3 className="text-[20px] font-semibold">Nền tảng Đăng tin Bất động sản Thế hệ mới</h3>
                    <p className="text-gray-200 leading-relaxed">
                        Đăng tin tìm kiếm khách hàng, quản lý danh mục bất động sản, gợi ý
                        thông minh giỏ hàng phù hợp cho khách hàng mục tiêu.
                    </p>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="mt-2 bg-[#FFD43B] text-[#1B264F] font-semibold hover:bg-[#ffe480] border-none"
                        onClick={() => {
                            setEditingId(null);       // tạo mới
                            setOpenCreate(true);
                        }}
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
                onSearch={(f) => {
                    const nextFilters = cleanObj(f || {});
                    setFilters(nextFilters);
                    dispatch(setPage(0));
                    pushUrl({ page: 0, filters: nextFilters });
                }}
                onCreate={() => {
                    setEditingId(null);
                    setOpenCreate(true);
                }}
            />

            {/* Status Tabs */}
            <div className="mt-4 bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] px-3 py-3">
                <PostStatusTabs
                    activeKey={status}
                    onChange={(newStatus) => {
                        setStatus(newStatus);
                        dispatch(setPage(0));
                        pushUrl({ status: newStatus, page: 0 });
                    }}
                    counts={counts}
                />
            </div>

            {/* Post List + Pagination */}
            <div className="mt-4">
                <PostList
                    loading={delayedLoading}
                    items={list}
                    total={totalElements}
                    page={page + 1}
                    pageSize={size}
                    onPageChange={(p) => {
                        dispatch(setPage(p - 1));
                        pushUrl({ page: p - 1 });
                    }}
                    onPageSizeChange={(n) => {
                        dispatch(setSize(n));
                        dispatch(setPage(0));
                        pushUrl({ size: n, page: 0 });
                    }}
                    // 🆕 truyền callback click item
                    onItemClick={(id) => {
                        handleEndHighlight(); // Tắt highlight trước khi mở Drawer
                        handleOpenDetail(id);
                    }}
                    onHighlightEnd={handleEndHighlight}
                    onViewWarningClick={handleOpenWarning}
                    highlightedId={highlightedId}
                />
            </div>

            {/* Drawer tạo/chỉnh sửa */}
            <PostCreateDrawer
                open={openCreate}
                onClose={handleCloseDrawer}
                onCreated={() => {
                    handleCloseDrawer();
                    dispatch(fetchMyPropertyCountsThunk());
                    dispatch(fetchMyPropertiesThunk({ page, size, status, ...filters }));
                }}
                user={user}
                editingId={editingId}
                isEdit={!!editingId}
            />
            <WarningModal 
                open={warningModal.open}
                onClose={handleCloseWarning}
                message={warningModal.message}
            />
        </div>
    );
}
