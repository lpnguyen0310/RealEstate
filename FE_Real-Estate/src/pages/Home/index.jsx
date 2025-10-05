// src/pages/Home/index.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Input, Button, Carousel, Tag, Modal } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

import FeatureTools from "../../components/button/FeatureTools";
import FeaturedList from "../../components/cards/FeaturedList";
import FeaturedProjects from "../../components/sections/FeaturedProjects";
import FirstTimeBuyerGuide from "../../components/sections/FirstTimeBuyerGuide";
import BannerCta from "../../components/sections/BannerCta";
import bannerPlanning from "../../assets/home-section4-image-bg.png";
import bannerResearch from "../../assets/home-section6-image-bg.png";
import bannerPosting from "../../assets/home-section7-image-bg.png";
import bannerContact from "../../assets/home-section8-image-bg.png";
import MetroSearchPanel from "../../components/search/MetroModal";

import FilterModal from "../../components/filters/FilterModal";
import SearchQuickPanel from "../../components/search/SearchQuickPanel";

const trending = [
    "mua nhà phố bình tân dưới 7 tỷ",
    "bán nhà tân phú",
    "nhà tân bình 3-7 tỷ",
    "nhà đất bình thạnh",
    "nhà hẻm đẹp gò vấp",
    "bán căn hộ quận 7",
    "bán nhà đất quận 8",
];

export default function Home() {
    const [mode, setMode] = useState("buy"); // 'buy' | 'rent'
    const [query, setQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState(null);

    // Quick panel (overlay)
    const [openQuickPanel, setOpenQuickPanel] = useState(false);
    const searchCardRef = useRef(null);

    // ====== Đo vị trí/size của RIÊNG ô Input để canh panel ======
    const rowRef = useRef(null);           // anchor: hàng controls
    const inputWrapRef = useRef(null);     // chỉ bọc input (không gồm nút Tìm kiếm)
    const [panelBox, setPanelBox] = useState({ left: 0, width: 0 });

    const recomputePanelBox = () => {
        const row = rowRef.current;
        const inputWrap = inputWrapRef.current;
        if (!row || !inputWrap) return;

        const rowRect = row.getBoundingClientRect();
        const inputRect = inputWrap.getBoundingClientRect();

        const left = Math.max(0, inputRect.left - rowRect.left);
        const width = Math.max(0, inputRect.width);

        setPanelBox({ left, width });
    };

    useLayoutEffect(() => {
        recomputePanelBox();
    }, []);
    const [showMetro, setShowMetro] = useState(false);

    useEffect(() => {
        const handleOpen = () => setShowMetro(true);
        window.addEventListener("open-metro-panel", handleOpen);
        return () => window.removeEventListener("open-metro-panel", handleOpen);
    }, []);
    useEffect(() => {
        if (openQuickPanel) {
            // đảm bảo đo lại ngay khi mở panel
            requestAnimationFrame(recomputePanelBox);
        }

        // Theo dõi thay đổi kích thước
        const ro = new ResizeObserver(() => recomputePanelBox());
        const row = rowRef.current;
        const inputWrap = inputWrapRef.current;
        try {
            if (row) ro.observe(row);
            if (inputWrap) ro.observe(inputWrap);
        } catch { }

        const onWin = () => recomputePanelBox();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, true); // nếu có sticky/scroll container

        return () => {
            try { ro.disconnect(); } catch { }
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openQuickPanel]);

    // Close panel when click outside or press ESC
    useEffect(() => {
        function onDocClick(e) {
            if (!searchCardRef.current) return;
            if (openQuickPanel && !searchCardRef.current.contains(e.target)) {
                setOpenQuickPanel(false);
            }
        }
        function onKeydown(e) {
            if (e.key === "Escape") setOpenQuickPanel(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKeydown);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKeydown);
        };
    }, [openQuickPanel]);

    const handleApplyFilters = (payload) => {
        setFilters(payload);
        // TODO: call API with filters
    };

    const handleSearch = () => {
        setOpenQuickPanel(true);
        requestAnimationFrame(recomputePanelBox);
    };

    return (
        <div className="w-full">
            {/* ================= HERO ================= */}
            <section className="relative w-full bg-gradient-to-br from-[#1b2a57] via-[#23356c] to-[#2b5aa6] text-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 pt-10 lg:pt-16 pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left */}
                        <div>
                            <h1 className="text-[36px] leading-[1.15] font-extrabold sm:text-[44px] lg:text-[56px]">
                                Tìm nhà thông thái
                                <br />
                                Thoải mái an cư
                            </h1>
                            <p className="mt-4 text-white/85 text-[15px] lg:text-[17px] max-w-[560px]">
                                Nền tảng bất động sản đầu tiên tối ưu trải nghiệm tìm bất động sản theo
                                tiêu chí nâng cao. Hàng ngàn bất động sản phù hợp{" "}
                                <span className="font-semibold">dành riêng cho bạn</span>. Bắt đầu tìm kiếm ngay!
                            </p>
                        </div>

                        {/* Right */}
                        <div className="w-full">
                            <div className="bg-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <Carousel autoplay dots className="h-[220px] sm:h-[260px] lg:h-[300px]">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-full">
                                            <img
                                                className="w-full h-[220px] sm:h-[260px] lg:h-[300px] object-cover"
                                                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop"
                                                alt={`banner-${i}`}
                                            />
                                        </div>
                                    ))}
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= SEARCH ================= */}
            <section className="-mt-12 lg:-mt-16 relative z-20">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <div
                        ref={searchCardRef}
                        className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-visible"
                    >
                        {/* Pills */}
                        <div className="px-6 pt-5">
                            <div className="inline-flex bg-[#eef3fb] rounded-full p-1">
                                <button
                                    onClick={() => setMode("buy")}
                                    className={`px-6 py-2 rounded-full font-semibold transition ${mode === "buy" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"
                                        }`}
                                >
                                    Mua
                                </button>
                                <button
                                    onClick={() => setMode("rent")}
                                    className={`px-6 py-2 rounded-full font-semibold transition ${mode === "rent" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"
                                        }`}
                                >
                                    Thuê
                                </button>
                            </div>
                        </div>

                        {/* Controls + overlay anchor */}
                        <div className="px-6 pb-5 pt-4 relative">
                            {/* Hàng controls (anchor) */}
                            <div ref={rowRef} className="flex flex-col lg:flex-row gap-3 relative">
                                <Button
                                    size="large"
                                    icon={<FilterOutlined />}
                                    className="lg:w-[180px] w-full h-[44px] !rounded-xl !border-none !bg-[#f1f5ff] hover:!bg-[#e8efff] text-[#17306b] font-semibold shadow-sm"
                                    onClick={() => setShowFilter(true)}
                                >
                                    Bộ lọc
                                </Button>

                                {/* Nhóm Input + nút Tìm kiếm */}
                                <div className="flex-1 flex gap-3 items-stretch">
                                    {/* CHỈ bọc riêng ô Input để đo chiều rộng panel */}
                                    <div ref={inputWrapRef} className="flex-1">
                                        <Input
                                            size="large"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Địa chỉ, tên dự án, khu vực, thời gian di chuyển..."
                                            className="w-full h-[44px] !rounded-xl"
                                            onPressEnter={handleSearch}
                                            onFocus={() => setOpenQuickPanel(true)}
                                        />
                                    </div>

                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<SearchOutlined />}
                                        className="h-[44px] !rounded-xl bg-[#17306b] hover:!bg-[#122659] px-6 font-semibold"
                                        onClick={handleSearch}
                                    >
                                        Tìm kiếm
                                    </Button>
                                </div>

                                {/* ===== Quick panel overlay (đè lên, canh theo inputWrapRef) ===== */}
                                {openQuickPanel && (
                                    <div
                                        className="absolute z-50 top-[calc(100%+8px)]"
                                        style={{ left: `${panelBox.left}px`, width: `${panelBox.width}px` }}
                                    >
                                        <SearchQuickPanel
                                            trending={trending}
                                            onPickTrending={(t) => {
                                                setQuery(t);
                                                setOpenQuickPanel(false);
                                                // TODO: thực thi tìm kiếm thật sự nếu muốn
                                            }}
                                            onPickMetro={() => setOpenQuickPanel(false)}
                                            onPickArea={() => setOpenQuickPanel(false)}
                                            onPickTravelTime={() => setOpenQuickPanel(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Xu hướng tìm kiếm (bản cũ) – luôn hiển thị; panel sẽ đè lên khi mở */}
                            <div className="mt-4">
                                <div className="text-gray-800 font-semibold mb-2">Xu hướng tìm kiếm</div>
                                <div className="flex flex-wrap gap-2">
                                    {trending.map((t) => (
                                        <Tag
                                            key={t}
                                            onClick={() => setQuery(t)}
                                            className="cursor-pointer rounded-full px-3 py-1 bg-[#eef6ff] hover:bg-[#e1efff] border-none text-[#1f5fbf]"
                                        >
                                            <span className="mr-1">📈</span>
                                            {t}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= CONTENT ================= */}
            <section className="bg-[#f7fafc] pt-12 lg:pt-16 pb-24">
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                    <FeatureTools />
                    <FeaturedList />
                    <BannerCta
                        title="Tra cứu quy hoạch"
                        description={
                            <>Kiểm tra quy hoạch online theo: số tờ, số thửa, tọa độ… với độ chính xác cao và dữ liệu mới nhất.</>
                        }
                        buttonLabel="Khám phá ngay"
                        href="/tra-cuu-quy-hoach"
                        bg={bannerPlanning}
                        side="right"
                        tone="light"
                        minH={300}
                    />
                    <FeaturedProjects />
                    <FirstTimeBuyerGuide />
                    <BannerCta
                        title="Tra cứu kế hoạch"
                        description={
                            <>Kiểm tra quy hoạch online theo: số tờ, số thửa, toạ độ... với độ chính xác cao và dữ liệu mới nhất</>
                        }
                        buttonLabel="Khám phá ngay"
                        href="/dang-tin"
                        bg={bannerResearch}
                        side="left"
                        tone="dark"
                        minH={320}
                    />
                    <BannerCta
                        title="Đăng tin chuyên nghiệp"
                        description={
                            <>Muốn tìm khách hàng chất lượng? Khám phá giải pháp đăng tin toàn diện tại Radanhadat.vn với cực nhiều ưu đãi trong giai đoạn ra mắt nền tảng</>
                        }
                        buttonLabel="Đăng tin ngay"
                        href="/dang-tin"
                        bg={bannerPosting}
                        side="right"
                        tone="dark"
                        minH={320}
                    />
                    <BannerCta
                        title="“Làm” nội thất đẹp mê say"
                        description={<>Giảm ngay 5% khi làm nội thất cùng dg home</>}
                        buttonLabel="Khám phá ngay"
                        href="/dang-tin"
                        bg={bannerContact}
                        side="left"
                        tone="dark"
                        minH={320}
                    />
                </div>
            </section>

            {/* ================= MODALS ================= */}
            <FilterModal
                open={showFilter}
                onClose={() => setShowFilter(false)}
                onApply={handleApplyFilters}
                initial={filters}
            />
            <Modal
                open={showMetro}
                onCancel={() => setShowMetro(false)}
                width="90%"
                footer={null}
                bodyStyle={{ padding: 0 }}
            >
                <MetroSearchPanel />
            </Modal>
        </div>
    );
}
