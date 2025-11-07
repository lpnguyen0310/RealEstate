// src/pages/dashboard/posts/PostManagerPage.jsx
import { Button } from "antd";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
const parseNumber = (v) => (v == null ? undefined : isNaN(+v) ? undefined : +v);

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
    // page trong URL là 1-based
    const base = cleanObj({
        tab: status && status !== "active" ? status : undefined,
        page: page > 0 ? page + 1 : 1,
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

    const { list, page, size, totalElements, counts, loading: rawLoading } = useSelector((s) => ({
        list: s.property.myList,
        page: s.property.myPage,
        size: s.property.mySize,
        totalElements: s.property.myTotalElements,
        counts: s.property.counts,
        loading: s.property.loading,
    }));

    // ---- local ui states ----
    const [status, setStatus] = useState(searchParams.get("tab") || "active");
    const [filters, setFilters] = useState(parseFiltersFromSearch(searchParams));
    const [openCreate, setOpenCreate] = useState(false);

    // 🆕 state để mở Drawer chi tiết theo ID
    const [editingId, setEditingId] = useState(null);

    const handleOpenWarning = useCallback((message) => {
        setWarningModal({ open: true, message: message || "" });
    }, []);

    const handleCloseWarning = useCallback(() => {
        setWarningModal({ open: false, message: "" });
    }, []);

    /* ========== URL -> STATE ========== */
    useEffect(() => {
        const urlStatus = searchParams.get("tab") || "active";
        const urlPage = parseNumber(searchParams.get("page")) ?? 1;
        const urlSize = parseNumber(searchParams.get("size")) ?? size;

        setStatus(urlStatus);
        setFilters(parseFiltersFromSearch(searchParams));

        if (urlPage - 1 !== page) dispatch(setPage(Math.max(0, urlPage - 1)));
        if (urlSize !== size && urlSize != null) dispatch(setSize(urlSize));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    /* ========== STATE -> FETCH ========== */
    useEffect(() => {
        dispatch(fetchMyPropertiesThunk({ page, size, status, ...filters }));
    }, [dispatch, page, size, status, filters]);

    // Fetch counts (1 lần)
    useEffect(() => {
        dispatch(fetchMyPropertyCountsThunk());
    }, [dispatch]);

    // Đọc warnedPostId -> mở WarningModal nếu cần
    useEffect(() => {
        const warnId = searchParams.get("warnedPostId");
        if (!warnId) return;

        if (list && list.length > 0 && status === "warned") {
            const postToWarn = list.find((p) => p.id === Number(warnId));
            if (postToWarn) {
                handleOpenWarning(postToWarn.latestWarningMessage);
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("warnedPostId");
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [searchParams, list, status, setSearchParams, handleOpenWarning]);

    // ===== Highlight 1 item bằng viewPostId trong URL rồi xoá param
    useEffect(() => {
        const viewIdParam = searchParams.get("viewPostId");
        if (!viewIdParam || !list || list.length === 0 || highlightedId == viewIdParam) {
            return;
        }

        const postToView = list.find((p) => p.id == viewIdParam);
        if (postToView) {
            setHighlightedId(postToView.id);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("viewPostId");
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, list, highlightedId, setSearchParams]);

    // Tắt highlight sau 10s (khớp CSS animation dài)
    useEffect(() => {
        if (!highlightedId) return;
        const t = setTimeout(() => setHighlightedId(null), 10000);
        return () => clearTimeout(t);
    }, [highlightedId]);

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

    // Skeleton min duration
    const [delayedLoading, setDelayedLoading] = useState(false);
    useEffect(() => {
        if (rawLoading) {
            setDelayedLoading(true);
        } else {
            const t = setTimeout(() => setDelayedLoading(false), 1200);
            return () => clearTimeout(t);
        }
    }, [rawLoading]);

    // 🆕 mở Drawer chi tiết từ card
    const handleOpenDetail = (id) => {
        if (!id) return;
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

    // —— Tối ưu autoplay khi tab bị ẩn
    const swiperAutoplayRef = useRef(null);
    useEffect(() => {
        const onVis = () => {
            const inst = swiperAutoplayRef.current;
            if (!inst) return;
            if (document.hidden) inst.stop();
            else inst.start();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    return (
        <div>
            {/* Banner (responsive) */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1B264F] to-[#1D5DCB] py-4 md:py-6 px-4 md:px-8 text-white mb-6 md:mb-8 flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 w-full md:max-w-[540px] space-y-2 md:space-y-3">
                    <h2 className="text-[22px] md:text-[26px] font-bold">Badongsan.vn</h2>
                    <h3 className="text-[16px] md:text-[20px] font-semibold">
                        Nền tảng Đăng tin Bất động sản Thế hệ mới
                    </h3>
                    <p className="text-gray-200 text-[13px] md:text-[14px] leading-relaxed">
                        Đăng tin tìm kiếm khách hàng, quản lý danh mục bất động sản, gợi ý thông minh giỏ hàng phù hợp cho khách hàng mục tiêu.
                    </p>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="mt-1 md:mt-2 bg-[#FFD43B] text-[#1B264F] font-semibold hover:bg-[#ffe480] border-none"
                        onClick={() => {
                            setEditingId(null); // tạo mới
                            setOpenCreate(true);
                        }}
                    >
                        Đăng tin mới
                    </Button>
                </div>

                <div className="flex-1 w-full mt-4 md:mt-0 md:ml-10 max-w-[720px]">
                    <Swiper
                        modules={[SwiperPagination, Autoplay]}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        loop
                        onAutoplay={(autoplay) => (swiperAutoplayRef.current = autoplay)}
                        className="rounded-xl overflow-hidden"
                    >
                        {SLIDES.map((src, i) => (
                            <SwiperSlide key={i}>
                                <img
                                    src={src}
                                    alt={`slide-${i + 1}`}
                                    className="w-full h-[200px] sm:h-[240px] md:h-[300px] object-cover rounded-xl"
                                    loading="lazy"
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
