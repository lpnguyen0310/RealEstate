import { useState, useEffect } from "react";
import { Tag, Pagination, Spin } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import { fetchPropertiesThunk, setPage as setReduxPage } from "@/store/propertySlice";

/* ================= Helpers ================= */
const parseList = (v) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

const getKeywordFromURL = (searchParams) =>
    searchParams.get("keyword") || searchParams.get("q") || "";

const getFiltersFromURL = (searchParams) => {
    const f = {};

    // number fields (backend keys)
    ["priceFrom", "priceTo", "areaFrom", "areaTo", "bedroomsFrom", "bathroomsFrom", "cityId"].forEach((k) => {
        const val = searchParams.get(k);
        if (val !== null && val !== "") f[k] = Number(val);
    });

    // strings
    ["pricePreset", "areaPreset", "legalType"].forEach((k) => {
        const val = searchParams.get(k);
        if (val) f[k] = val;
    });

    // list fields (backend keys)
    ["directions", "positions", "amenities", "types"].forEach((k) => {
        const arr = parseList(searchParams.get(k));
        if (arr.length) f[k] = arr;
    });

    return Object.keys(f).length ? f : null;
};

// map BE -> UI (để modal hiển thị lại đúng)
const mapBackendToUiFilters = (api = {}) => {
    const ui = {};

    // giữ lại các field modal dùng trực tiếp
    if (api.priceFrom != null) ui.priceFrom = api.priceFrom;
    if (api.priceTo != null) ui.priceTo = api.priceTo;
    if (api.areaFrom != null) ui.areaFrom = api.areaFrom;
    if (api.areaTo != null) ui.areaTo = api.areaTo;
    if (api.pricePreset) ui.pricePreset = api.pricePreset;
    if (api.areaPreset) ui.areaPreset = api.areaPreset;

    // min -> label
    if (api.bathroomsFrom != null) {
        const n = Number(api.bathroomsFrom);
        ui.baths = [n >= 4 ? "4+ phòng tắm" : `${n} phòng tắm`];
    }
    if (api.bedroomsFrom != null) {
        const n = Number(api.bedroomsFrom);
        ui.beds = [n >= 4 ? "4+ phòng ngủ" : `${n} phòng ngủ`];
    }

    if (Array.isArray(api.directions)) ui.directions = api.directions;
    if (Array.isArray(api.positions)) ui.positions = api.positions;
    if (Array.isArray(api.types)) ui.types = api.types;

    // amenities từ URL thường là string -> UI muốn number (nếu UI bạn dùng id)
    if (Array.isArray(api.amenities)) {
        ui.amenities = api.amenities
            .map((x) => Number(x))
            .filter((x) => !Number.isNaN(x));
    }

    if (api.legalType) ui.legalType = api.legalType;

    return ui;
};

// lấy min number từ label kiểu: "4+ phòng tắm", "3 phòng ngủ"
const parseMinFromLabel = (s) => {
    if (s == null) return null;
    if (typeof s === "number") return s;
    const m = String(s).match(/\d+/);
    return m ? Number(m[0]) : null;
};

const normalizeDirection = (d) => (d ? String(d).trim() : null);

// map UI -> BE (để call api + ghi URL)
const mapUiFiltersToBackendParams = (f = {}) => {
    const out = {};

    // numbers
    if (f.priceFrom != null) out.priceFrom = f.priceFrom;
    if (f.priceTo != null) out.priceTo = f.priceTo;
    if (f.areaFrom != null) out.areaFrom = f.areaFrom;
    if (f.areaTo != null) out.areaTo = f.areaTo;

    // presets (nếu bạn muốn giữ để UI hiển thị)
    if (f.pricePreset) out.pricePreset = f.pricePreset;
    if (f.areaPreset) out.areaPreset = f.areaPreset;

    // bedrooms/bathrooms: UI array label -> BE min number
    if (Array.isArray(f.beds) && f.beds.length) {
        const mins = f.beds.map(parseMinFromLabel).filter((x) => x != null);
        if (mins.length) out.bedroomsFrom = Math.max(...mins);
    }
    if (Array.isArray(f.baths) && f.baths.length) {
        const mins = f.baths.map(parseMinFromLabel).filter((x) => x != null);
        if (mins.length) out.bathroomsFrom = Math.max(...mins);
    }

    // list fields
    if (Array.isArray(f.directions) && f.directions.length) {
        out.directions = f.directions.map(normalizeDirection).filter(Boolean);
    }
    if (Array.isArray(f.positions) && f.positions.length) {
        out.positions = f.positions.map((x) => String(x).trim()).filter(Boolean);
    }

    // legal
    if (f.legalType) out.legalType = String(f.legalType).trim();

    // amenities: UI có thể là number[] -> BE string[]
    if (Array.isArray(f.amenities) && f.amenities.length) {
        out.amenities = f.amenities.map(String);
    }

    // types
    if (Array.isArray(f.types) && f.types.length) {
        out.types = f.types.map((x) => String(x).trim()).filter(Boolean);
    }

    return out;
};

// clean null/empty cho BE
const cleanBackendParams = (mapped = {}) =>
    Object.fromEntries(
        Object.entries(mapped).filter(([_, v]) => {
            if (v == null) return false;
            if (Array.isArray(v)) return v.length > 0;
            if (v === "") return false;
            return true;
        })
    );

/* ================= Component ================= */
export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();

    const {
        list: pageItems,
        loading,
        error,
        page: currentPage,
        pageSize: currentPageSize,
        totalElements: total,
    } = useSelector((state) => state.property);

    // ✅ keyword lấy từ URL
    const [keyword, setKeyword] = useState(() => getKeywordFromURL(searchParams));
    const [sort, setSort] = useState("relevance");

    // ✅ tách 2 state: UI vs BE
    const [filtersBE, setFiltersBE] = useState(() => getFiltersFromURL(searchParams));
    const [filtersUI, setFiltersUI] = useState(() =>
        mapBackendToUiFilters(getFiltersFromURL(searchParams) || {})
    );

    // ✅ Khi URL đổi (reload, back/forward, share link...), hydrate lại state
    useEffect(() => {
        const kw = getKeywordFromURL(searchParams);
        setKeyword(kw);

        const be = getFiltersFromURL(searchParams);
        setFiltersBE(be);

        const ui = mapBackendToUiFilters(be || {});
        setFiltersUI(ui);
    }, [searchParams]);

    // ✅ Fetch data
    useEffect(() => {
        const params = {
            page: currentPage,
            size: currentPageSize,
            sort:
                sort === "relevance"
                    ? "postedAt,desc"
                    : sort.replace("Asc", ",asc").replace("Desc", ",desc"),
        };

        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const kwMode = searchParams.get("kwMode");

        if (keyword) params.keyword = keyword; // BE dùng keyword
        if (type) params.type = type;
        if (category) params.category = category;
        if (kwMode) params.kwMode = kwMode;

        if (filtersBE) {
            Object.entries(filtersBE).forEach(([k, v]) => {
                params[k] = Array.isArray(v) ? v.join(",") : v;
            });
        }

        dispatch(fetchPropertiesThunk(params));
    }, [
        dispatch,
        keyword,
        sort,
        filtersBE,
        currentPage,
        currentPageSize,
        searchParams,
    ]);

    // ✅ Ghi keyword vào URL (dùng q để UI)
    const applyKeywordToURL = (kw) => {
        const sp = new URLSearchParams(searchParams);

        if (kw) sp.set("q", kw);
        else sp.delete("q");

        // optional: nếu BE bạn chỉ dùng keyword
        // bạn có thể set thêm keyword để đồng nhất
        // sp.set("keyword", kw); // nếu muốn

        dispatch(setReduxPage(0));
        setSearchParams(sp);
        setKeyword(kw);
    };

    const handleResetAll = () => {
        setKeyword("");
        setSort("relevance");
        setFiltersBE(null);
        setFiltersUI({});
        dispatch(setReduxPage(0));

        const sp = new URLSearchParams(searchParams);
        [
            "q", "keyword", "type", "category", "kwMode",
            "priceFrom", "priceTo", "areaFrom", "areaTo",
            "pricePreset", "areaPreset",
            "bedroomsFrom", "bathroomsFrom",
            "directions", "positions",
            "amenities", "legalType",
            "types",
            "cityId",
        ].forEach((k) => sp.delete(k));

        setSearchParams(sp);
    };

    // ================= UI STATES =================
    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-red-500 text-lg font-medium">
                    Đã xảy ra lỗi khi tải dữ liệu.
                </p>
                <p className="text-gray-500 mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-6">
            <div className="mx-auto max-w-[1220px] px-4">
                {/* 🌟 FILTER SECTION */}
                <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-100 sticky top-2 z-20">
                    <SearchFilters
                        keyword={keyword}
                        onKeywordChange={applyKeywordToURL}
                        sort={sort}
                        onSortChange={setSort}
                        onResetAll={handleResetAll}
                        initialFilters={filtersUI} // ✅ truyền UI state để giữ trạng thái
                        onApplyFilters={(uiFilters) => {
                            const mapped = mapUiFiltersToBackendParams(uiFilters);
                            const cleaned = cleanBackendParams(mapped);

                            // ✅ lưu cả 2 state
                            setFiltersUI(uiFilters);
                            setFiltersBE(Object.keys(cleaned).length ? cleaned : null);

                            dispatch(setReduxPage(0));

                            const sp = new URLSearchParams(searchParams);

                            // xoá toàn bộ filter keys chuẩn BE
                            [
                                "priceFrom", "priceTo", "areaFrom", "areaTo",
                                "pricePreset", "areaPreset",
                                "bedroomsFrom", "bathroomsFrom",
                                "directions", "positions",
                                "amenities", "legalType",
                                "types",
                                "cityId",
                            ].forEach((k) => sp.delete(k));

                            // set lại
                            Object.entries(cleaned).forEach(([k, v]) => {
                                sp.set(k, Array.isArray(v) ? v.join(",") : String(v));
                            });

                            setSearchParams(sp);
                        }}
                    />
                </div>

                {/* 📌 SEARCH SUMMARY */}
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 text-sm text-gray-700">
                    {searchParams.get("type") && (
                        <Tag color="geekblue">{searchParams.get("type")}</Tag>
                    )}
                    {searchParams.get("category") && (
                        <Tag color="blue">{searchParams.get("category")}</Tag>
                    )}
                    <span className="ml-auto">
                        🔍 Tìm thấy <strong>{total}</strong> kết quả phù hợp
                    </span>
                </div>

                {/* 🏡 LIST RESULTS */}
                <div className="mt-5">
                    <SearchList items={pageItems} />
                </div>

                {/* 🔽 PAGINATION */}
                <div className="mt-8 flex justify-center">
                    <Pagination
                        current={currentPage + 1}
                        pageSize={currentPageSize}
                        total={total}
                        showSizeChanger={false}
                        className="shadow-sm p-3 bg-white rounded-xl border border-gray-100"
                        onChange={(page) => dispatch(setReduxPage(page - 1))}
                    />
                </div>
            </div>
        </div>
    );
}
