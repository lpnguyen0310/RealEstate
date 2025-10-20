import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Tag } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import FilterModal from "../filters/FilterModal";
import SearchQuickPanel from "./SearchQuickPanel";

const trending = [
    "mua nhà phố bình tân dưới 7 tỷ",
    "bán nhà tân phú",
    "nhà tân bình 3-7 tỷ",
    "nhà đất bình thạnh",
    "nhà hẻm đẹp gò vấp",
    "bán căn hộ quận 7",
    "bán nhà đất quận 8",
];

export default function SearchCard() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("buy"); // 'buy' | 'rent'
    const [query, setQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({});

    // --- Logic cho Quick Panel (Overlay) ---
    const [openQuickPanel, setOpenQuickPanel] = useState(false);
    const searchCardRef = useRef(null);
    const rowRef = useRef(null);
    const inputWrapRef = useRef(null);
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

    useEffect(() => {
        if (openQuickPanel) {
            requestAnimationFrame(recomputePanelBox);
        }
        const ro = new ResizeObserver(recomputePanelBox);
        const row = rowRef.current;
        const inputWrap = inputWrapRef.current;
        try {
            if (row) ro.observe(row);
            if (inputWrap) ro.observe(inputWrap);
        } catch {}
        const onWin = () => recomputePanelBox();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, true);
        return () => {
            try { ro.disconnect(); } catch {}
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin, true);
        };
    }, [openQuickPanel]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (openQuickPanel && searchCardRef.current && !searchCardRef.current.contains(e.target)) {
                setOpenQuickPanel(false);
            }
        };
        const onKeydown = (e) => {
            if (e.key === "Escape") setOpenQuickPanel(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKeydown);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKeydown);
        };
    }, [openQuickPanel]);

    // --- Logic tìm kiếm và điều hướng ---
    const executeSearch = (searchQuery) => {
        const params = new URLSearchParams();
        params.append("type", mode === "buy" ? "sell" : "rent");
        if (searchQuery.trim()) {
            params.append("keyword", searchQuery.trim());
        }
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });
        navigate(`/search?${params.toString()}`);
    };

    const handleSearch = () => {
        executeSearch(query);
    };

    const handleTrendingClick = (trendingQuery) => {
        setQuery(trendingQuery);
        executeSearch(trendingQuery);
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setShowFilter(false);
        // Tùy chọn: tìm kiếm ngay sau khi áp dụng bộ lọc bằng cách gọi executeSearch("")
    };

    return (
        <section className="-mt-12 lg:-mt-16 relative z-20">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
                <div ref={searchCardRef} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-visible">
                    <div className="px-6 pt-5">
                        <div className="inline-flex bg-[#eef3fb] rounded-full p-1">
                            <button onClick={() => setMode("buy")} className={`px-6 py-2 rounded-full font-semibold transition ${mode === "buy" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"}`}>Mua</button>
                            <button onClick={() => setMode("rent")} className={`px-6 py-2 rounded-full font-semibold transition ${mode === "rent" ? "bg-[#17306b] text-white shadow" : "text-[#17306b]"}`}>Thuê</button>
                        </div>
                    </div>
                    <div className="px-6 pb-5 pt-4 relative">
                        <div ref={rowRef} className="flex flex-col lg:flex-row gap-3 relative">
                            <Button size="large" icon={<FilterOutlined />} className="lg:w-[180px] w-full h-[44px] !rounded-xl !border-none !bg-[#f1f5ff] hover:!bg-[#e8efff] text-[#17306b] font-semibold shadow-sm" onClick={() => setShowFilter(true)}>Bộ lọc</Button>
                            <div className="flex-1 flex gap-3 items-stretch">
                                <div ref={inputWrapRef} className="flex-1">
                                    <Input size="large" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Địa chỉ, tên dự án, khu vực..." className="w-full h-[44px] !rounded-xl" onPressEnter={handleSearch} onFocus={() => setOpenQuickPanel(true)} />
                                </div>
                                <Button type="primary" size="large" icon={<SearchOutlined />} className="h-[44px] !rounded-xl bg-[#17306b] hover:!bg-[#122659] px-6 font-semibold" onClick={handleSearch}>Tìm kiếm</Button>
                            </div>
                            {openQuickPanel && (
                                <div className="absolute z-50 top-[calc(100%+8px)]" style={{ left: `${panelBox.left}px`, width: `${panelBox.width}px` }}>
                                    <SearchQuickPanel trending={trending} onPickTrending={(t) => {
                                        handleTrendingClick(t);
                                        setOpenQuickPanel(false);
                                    }} onPickMetro={() => setOpenQuickPanel(false)} onPickArea={() => setOpenQuickPanel(false)} onPickTravelTime={() => setOpenQuickPanel(false)} />
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <div className="text-gray-800 font-semibold mb-2">Xu hướng tìm kiếm</div>
                            <div className="flex flex-wrap gap-2">
                                {trending.map((t) => (
                                    <Tag key={t} onClick={() => handleTrendingClick(t)} className="cursor-pointer rounded-full px-3 py-1 bg-[#eef6ff] hover:bg-[#e1efff] border-none text-[#1f5fbf]">
                                        <span className="mr-1">📈</span>{t}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FilterModal open={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilters} initial={filters} />
        </section>
    );
}