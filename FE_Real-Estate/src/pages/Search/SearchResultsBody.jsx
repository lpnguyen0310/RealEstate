import { useState, useEffect } from "react";
import { Tag, Pagination } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import { fetchPropertiesThunk, setPage as setReduxPage } from "@/store/propertySlice";

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

    // State cho các control KHÔNG nằm trong URL (như sort)
    const [sort, setSort] = useState("relevance");
    // State `filters` bây giờ chỉ dùng để hiển thị giá trị ban đầu cho SearchFilters
    const [filters, setFilters] = useState(() => Object.fromEntries(searchParams.entries()));

    // --- NEW (1): Thêm useEffect này để đồng bộ UI của bộ lọc với URL ---
    // Khi người dùng bấm back/forward, UI của bộ lọc sẽ được cập nhật đúng.
    useEffect(() => {
        const allUrlParams = Object.fromEntries(searchParams.entries());
        setFilters(allUrlParams);
    }, [searchParams]);

    // --- useEffect chính để gọi API ---
    // useEffect này không thay đổi, nó đã làm đúng nhiệm vụ là đọc từ URL.
    useEffect(() => {
        const urlParams = Object.fromEntries(searchParams.entries());
        const apiParams = {
            page: currentPage,
            size: currentPageSize,
            sort: sort === "relevance" ? "postedAt,desc" : sort.replace('Asc', ',asc').replace('Desc', ',desc'),
        };
        Object.assign(apiParams, urlParams);
        
        // Ghi đè `q` bằng giá trị keyword từ input (nếu có)
        if (urlParams.q) {
             apiParams.q = urlParams.q;
        }

        dispatch(fetchPropertiesThunk(apiParams));

    }, [dispatch, sort, currentPage, currentPageSize, searchParams]);
    
    const handleResetAll = () => {
        setSort("relevance");
        dispatch(setReduxPage(0));
        // Reset bằng cách tạo một URL rỗng
        setSearchParams({});
    };

    // Giao diện cho Loading và Error
    if (loading) {
        return <div className="text-center py-20">Đang tải dữ liệu...</div>;
    }
    if (error) {
        return <div className="text-center py-20 text-red-600">Lỗi: {error}. Vui lòng thử lại.</div>;
    }

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-6">
            <SearchFilters
                keyword={searchParams.get("q") || ""}
                // --- CHANGED (2): onKeywordChange giờ sẽ cập nhật URL ---
                onKeywordChange={(kw) => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    if (kw) {
                        newSearchParams.set("q", kw);
                    } else {
                        newSearchParams.delete("q");
                    }
                    setSearchParams(newSearchParams);
                }}
                sort={sort}
                onSortChange={setSort}
                onResetAll={handleResetAll}
                initialFilters={filters}
                // --- CHANGED (3): onApplyFilters giờ sẽ cập nhật URL ---
                onApplyFilters={(newFilters) => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    Object.entries(newFilters).forEach(([key, value]) => {
                        if (value) {
                            newSearchParams.set(key, value);
                        } else {
                            newSearchParams.delete(key);
                        }
                    });
                    // Khi áp dụng bộ lọc mới, luôn reset về trang 1
                    newSearchParams.delete("page");
                    dispatch(setReduxPage(0));
                    setSearchParams(newSearchParams);
                }}
            />

            <div className="mt-3 text-sm text-gray-600">
                {searchParams.get("type") && (
                    <span>Loại: <Tag color="blue">{searchParams.get("type")}</Tag></span>
                )}
                {searchParams.get("category") && (
                    <span> / Danh mục: <Tag color="blue">{searchParams.get("category")}</Tag></span>
                )}
                <> — Tìm thấy <b>{total}</b> kết quả</>
            </div>

            <SearchList items={pageItems} />

            <div className="mt-6 flex justify-center">
                <Pagination
                    current={currentPage + 1}
                    pageSize={currentPageSize}
                    total={total}
                    showSizeChanger={false}
                    onChange={(page) => {
                        dispatch(setReduxPage(page - 1));
                    }}
                />
            </div>
        </div>
    );
}