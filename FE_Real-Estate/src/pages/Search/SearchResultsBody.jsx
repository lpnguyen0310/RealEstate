// src/pages/SearchResultsPage.jsx

import { useState, useEffect } from "react";
import { Tag, Pagination } from "antd";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import { fetchPropertiesThunk, setPage as setReduxPage } from "@/store/propertySlice"; // Chỉnh lại đường dẫn nếu cần

// Các hàm helpers không cần thiết cho việc lọc/sắp xếp ở client nữa
// bạn có thể xóa chúng nếu không dùng ở đâu khác.
// const parsePriceToTrieu = ...
// const normalize = ...
// const matchKeyword = ...
// const sortItems = ...

export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();

    // 1. KẾT NỐI REDUX STORE
    // Lấy state trực tiếp từ Redux thay vì quản lý bằng useState và gọi axios
    const {
        list: pageItems,      // Dữ liệu của trang hiện tại
        loading,
        error,
        page: currentPage,    // Số trang hiện tại (bắt đầu từ 0)
        pageSize: currentPageSize, // Kích thước trang
        totalElements: total, // Tổng số kết quả
    } = useSelector((state) => state.property);

    console.log("SearchResultsPage - pageItems:", pageItems, "loading:", loading, "error:", error, "currentPage:", currentPage, "currentPageSize:", currentPageSize, "total:", total);

    // 2. QUẢN LÝ CÁC GIÁ TRỊ LỌC TẠI LOCAL STATE
    // State này chỉ dùng để điều khiển các ô input, select box...
    const [keyword, setKeyword] = useState(() => searchParams.get("q") || "");
    const [sort, setSort] = useState("relevance");
    const [filters, setFilters] = useState(null);

    // 3. EFFECT "THẦN THÁNH" - GỌI LẠI API MỖI KHI BỘ LỌC THAY ĐỔI
    useEffect(() => {
        // Xây dựng object `params` để gửi lên cho thunk
        const params = {
            page: currentPage,
            size: currentPageSize,
            sort: sort === "relevance" ? "postedAt,desc" : sort.replace('Asc', ',asc').replace('Desc', ',desc'),
        };

        // Lấy các tham số từ URL
        const type = searchParams.get("type");
        const category = searchParams.get("category");

        // Thêm các bộ lọc vào params nếu chúng tồn tại
        if (keyword) params.keyword = keyword;
        if (type) params.type = type;
        if (category) params.category = category;
        if (filters?.priceFrom) params.priceFrom = filters.priceFrom;
        if (filters?.priceTo) params.priceTo = filters.priceTo;
        if (filters?.areaFrom) params.areaFrom = filters.areaFrom;
        if (filters?.areaTo) params.areaTo = filters.areaTo;
        // ... thêm các filter khác cho phòng ngủ, phòng tắm nếu có
        
        // GỌI API với các tham số đã tổng hợp
        dispatch(fetchPropertiesThunk(params));

        // Đồng bộ hóa keyword với URL
        if (keyword) {
            searchParams.set('q', keyword);
        } else {
            searchParams.delete('q');
        }
        setSearchParams(searchParams);

    }, [dispatch, keyword, sort, filters, currentPage, currentPageSize, searchParams, setSearchParams]);

    const handleResetAll = () => {
        setKeyword("");
        setSort("relevance");
        setFilters(null);
        dispatch(setReduxPage(0)); // Reset về trang đầu tiên trong Redux
        searchParams.delete('q');
        searchParams.delete('type');
        searchParams.delete('category');
        setSearchParams(searchParams);
    };

    // Giao diện cho Loading và Error (dùng state từ Redux)
    if (loading) {
        return <div className="text-center py-20">Đang tải dữ liệu...</div>;
    }
    if (error) {
        return <div className="text-center py-20 text-red-600">Lỗi: {error}. Vui lòng thử lại.</div>;
    }

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-6">
            <SearchFilters
                keyword={keyword}
                onKeywordChange={setKeyword}
                sort={sort}
                onSortChange={setSort}
                onResetAll={handleResetAll}
                initialFilters={filters}
                onApplyFilters={(newFilters) => {
                    setFilters(newFilters);
                    dispatch(setReduxPage(0)); // Reset về trang đầu khi áp dụng bộ lọc mới
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

            {/* `pageItems` giờ là `list` từ Redux, đã được map sẵn trong slice */}
            <SearchList items={pageItems} />

            <div className="mt-6 flex justify-center">
                <Pagination
                    current={currentPage + 1} // Antd Pagination bắt đầu từ 1
                    pageSize={currentPageSize}
                    total={total}
                    showSizeChanger={false} // Tạm thời ẩn đi để đơn giản
                    onChange={(page) => {
                        // Khi đổi trang, chỉ cần dispatch action, useEffect sẽ lo việc gọi lại API
                        dispatch(setReduxPage(page - 1));
                    }}
                />
            </div>
        </div>
    );
}