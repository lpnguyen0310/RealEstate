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

    const {
        list,
        page,
        size,
        totalElements,
        counts,
        pendingAction,
        rawLoading,
    } = useSelector((s) => ({
        list: s.property.myList,
        page: s.property.myPage,
        size: s.property.mySize,
        totalElements: s.property.myTotalElements,
        counts: s.property.counts,
        pendingAction: s.property.pendingAction,
        rawLoading: s.property.loading,
    }));

    const [status, setStatus] = useState(searchParams.get("tab") || "active");
    const [filters, setFilters] = useState(parseFiltersFromSearch(searchParams));
    const [openCreate, setOpenCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const handleOpenWarning = useCallback((message) => {
        setWarningModal({ open: true, message: message || "" });
    }, []);
    const handleCloseWarning = useCallback(() => {
        setWarningModal({ open: false, message: "" });
    }, []);

    /* ========== URL -> STATE ========== */
    useEffect(() => {
        const qp = Object.fromEntries(searchParams.entries());
        const warnId = qp.warnedPostId ? Number(qp.warnedPostId) : null;
        const viewId = qp.viewPostId ? Number(qp.viewPostId) : null;

        let urlStatus = qp.tab || "active";

        if (warnId) {
            dispatch(setPendingAction({ type: "warn", postId: warnId }));
            urlStatus = "warned";
        } else if (viewId) {
            dispatch(setPendingAction({ type: "view", postId: viewId }));
            urlStatus = "active";
        }

        setStatus(urlStatus);
        setFilters(parseFiltersFromSearch(searchParams));

        const urlPage = parseNumber(qp.page) ?? 1;
        const urlSize = parseNumber(qp.size) ?? size;

        if (urlPage - 1 !== page) dispatch(setPage(Math.max(0, urlPage - 1)));
        if (urlSize !== size && urlSize != null) dispatch(setSize(urlSize));
    }, [searchParams, dispatch]);

    /* ========== xử lý hành động chờ (highlight / mở modal) ========== */
    useEffect(() => {
        if (!pendingAction) return;
        if (rawLoading || !list || list.length === 0) return;

        const { type, postId } = pendingAction;
        const post = list.find((p) => p.id === postId);

        if (!post) {
            console.warn(`Pending Action: Không tìm thấy Post #${postId} trong tab ${status}.`);
            dispatch(clearPendingAction());
            return;
        }

        if (type === "warn") handleOpenWarning(post.latestWarningMessage);
        else if (type === "view") setHighlightedId(post.id);

        dispatch(clearPendingAction());
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("warnedPostId");
        newParams.delete("viewPostId");
        setSearchParams(newParams, { replace: true });
    }, [pendingAction, list, rawLoading, status, dispatch, handleOpenWarning, searchParams, setSearchParams]);

    useEffect(() => {
        if (!highlightedId) return;
        const t = setTimeout(() => setHighlightedId(null), 10000);
        return () => clearTimeout(t);
    }, [highlightedId]);

    /* ========== FETCH ========== */
    useEffect(() => {
        dispatch(fetchMyPropertiesThunk({ page, size, status, ...filters }));
    }, [dispatch, page, size, status, filters]);
    useEffect(() => {
        dispatch(fetchMyPropertyCountsThunk());
    }, [dispatch]);

    const [delayedLoading, setDelayedLoading] = useState(false);
    useEffect(() => {
        if (rawLoading) setDelayedLoading(true);
        else {
            const t = setTimeout(() => setDelayedLoading(false), 1200);
            return () => clearTimeout(t);
        }
    }, [rawLoading]);

    const pushUrl = (next = {}) => {
        const params = buildSearchParams({
            status: next.status ?? status,
            page: next.page ?? page,
            size: next.size ?? size,
            filters: next.filters ?? filters,
        });
        setSearchParams(params, { replace: false });
    };

    const handleOpenDetail = (id) => {
        if (!id) return;
        setEditingId(id);
        setOpenCreate(true);
    };
    const handleCloseDrawer = () => {
        setOpenCreate(false);
        setEditingId(null);
    };
    const handleEndHighlight = useCallback(() => setHighlightedId(null), []);

    // —— Swiper autoplay pause + bảo đảm update khi đổi kích thước
    const swiperAutoplayRef = useRef(null);
    useEffect(() => {
        const onVis = () => {
            const inst =
                swiperAutoplayRef.current?.$el?.[0]?.swiper || swiperAutoplayRef.current;
            if (!inst) return;
            if (document.hidden) inst.stop();
            else {
                inst.update();
                inst.start();
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    return (
        <section className="w-full min-w-0 overflow-x-hidden max-w-[100vw]">
            {/* Banner — mobile 1 cột, desktop 2 cột */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1B264F] to-[#1D5DCB] text-white mb-6 md:mb-8 p-4 md:p-6 pr-4 md:pr-6 relative">
                <div className="grid max-w-full grid-cols-1 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)] gap-4 lg:gap-8 items-center">
                    {/* LEFT */}
                    <div className="min-w-0">
                        <div className="space-y-2 md:space-y-3">
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
                                    setEditingId(null);
                                    setOpenCreate(true);
                                }}
                            >
                                Đăng tin mới
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT — slider fix full width */}
                    <div className="min-w-0 w-full max-w-full overflow-hidden">
                        <Swiper
                            modules={[SwiperPagination, Autoplay]}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            loop
                            onAutoplay={(autoplay) => (swiperAutoplayRef.current = autoplay)}
                            className="rounded-xl overflow-hidden !w-full !max-w-full h-[180px] xs:h-[200px] sm:h-[240px] md:h-[300px]"
                            style={{ width: "100%" }}
                            slidesPerView={1}
                            observer
                            observeParents
                            resizeObserver
                            onBeforeInit={(s) => {
                                s.params.observer = true;
                                s.params.observeParents = true;
                            }}
                            onResize={(s) => s.update()}
                            onBreakpoint={(s) => s.update()}
                        >
                            {SLIDES.map((src, i) => (
                                <SwiperSlide key={i} className="min-w-0 !w-full !max-w-full h-full">
                                    <img
                                        src={src}
                                        alt={`slide-${i + 1}`}
                                        className="block w-full max-w-full h-full object-cover rounded-xl"
                                        loading="lazy"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            {/* Filters + Tabs + List: giữ cấu trúc grid như OrderManagement */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Filters Bar */}
                <div className="min-w-0">
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
                </div>

                {/* Status Tabs */}
                <div className="min-w-0">
                    <div className="bg-white border border-gray-100 rounded-[18px] shadow-[0_6px_24px_rgba(0,0,0,0.04)] px-3 py-3 w-full max-w-full overflow-x-auto">
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
                </div>

                {/* Post List */}
                <div className="min-w-0">
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
                            handleEndHighlight();
                            handleOpenDetail(id);
                        }}
                        onHighlightEnd={handleEndHighlight}
                        onViewWarningClick={handleOpenWarning}
                        highlightedId={highlightedId}
                    />
                </div>
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

            <WarningModal open={warningModal.open} onClose={handleCloseWarning} message={warningModal.message} />
        </section>
    );
}
