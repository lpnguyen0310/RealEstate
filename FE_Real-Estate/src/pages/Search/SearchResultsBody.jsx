import { useState, useEffect } from "react";
import { Tag, Pagination, Spin } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import {
    fetchPropertiesThunk,
    setPage as setReduxPage,
} from "@/store/propertySlice";

const getFiltersFromURL = (searchParams) => {
    const filters = {};
    const keys = ["priceFrom", "priceTo", "areaFrom", "areaTo"];

    keys.forEach((key) => {
        if (searchParams.get(key)) filters[key] = Number(searchParams.get(key));
    });

    return Object.keys(filters).length > 0 ? filters : null;
};

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

    const [keyword, setKeyword] = useState(() =>
        searchParams.get("keyword") || searchParams.get("q") || ""
    );
    const [sort, setSort] = useState("relevance");
    const [filters, setFilters] = useState(() => getFiltersFromURL(searchParams));

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

        if (keyword) params.keyword = keyword;
        if (type) params.type = type;
        if (category) params.category = category;
        if (kwMode) params.kwMode = kwMode;

        if (filters) Object.assign(params, filters);

        dispatch(fetchPropertiesThunk(params));

        if (keyword) searchParams.set("q", keyword);
        else searchParams.delete("q");

        setSearchParams(searchParams);
    }, [dispatch, keyword, sort, filters, currentPage, currentPageSize]);

    const handleResetAll = () => {
        setKeyword("");
        setSort("relevance");
        setFilters(null);
        dispatch(setReduxPage(0));

        searchParams.delete("q");
        searchParams.delete("type");
        searchParams.delete("category");
        setSearchParams(searchParams);
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
                        onKeywordChange={setKeyword}
                        sort={sort}
                        onSortChange={setSort}
                        onResetAll={handleResetAll}
                        initialFilters={filters}
                        onApplyFilters={(newFilters) => {
                            setFilters(newFilters);
                            dispatch(setReduxPage(0));

                            const newParams = new URLSearchParams(searchParams);
                            ["priceFrom", "priceTo", "areaFrom", "areaTo"].forEach((k) =>
                                newParams.delete(k)
                            );

                            Object.entries(newFilters).forEach(([k, v]) => {
                                if (v) newParams.set(k, v);
                            });

                            setSearchParams(newParams);
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
