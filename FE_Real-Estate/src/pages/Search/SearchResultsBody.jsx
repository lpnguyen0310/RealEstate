import { useMemo, useState, useEffect } from "react";
import { Tag, Pagination } from "antd";
import { useSearchParams } from "react-router-dom";
import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import axios from "axios";

// ===== Helpers (Không thay đổi) =====
const parsePriceToTrieu = (label) => {
  if (!label) return null;
  const txt = String(label).toLowerCase().replace(/\s/g, "");
  const num = parseFloat(txt.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num)) return null;
  return txt.includes("tỷ") ? Math.round(num * 1000) : Math.round(num);
};

const normalize = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const matchKeyword = (item, q) => {
  if (!q) return true;
  const s = normalize(q);
  return [item.title, item.address, (item.tags || []).join(" ")].some((f) =>
    normalize(f).includes(s)
  );
};

const sortItems = (items, sort) => {
  const arr = [...items];
  switch (sort) {
    case "priceAsc":
      arr.sort((a, b) => (a.priceTrieu ?? 0) - (b.priceTrieu ?? 0));
      break;
    case "priceDesc":
      arr.sort((a, b) => (b.priceTrieu ?? 0) - (a.priceTrieu ?? 0));
      break;
    case "areaAsc":
      arr.sort((a, b) => (a.area ?? 0) - (b.area ?? 0));
      break;
    case "areaDesc":
      arr.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
      break;
    default:
      break;
  }
  return arr;
};

const vndToTrieu = (v) => (v == null ? null : Math.round(v / 1_000_000));
const extractInt = (label) => {
  if (label == null) return null;
  const m = String(label).match(/\d+/);
  return m ? Number(m[0]) : null;
};

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const category = searchParams.get("category");

  // ==================== THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ====================

  // 1. Khai báo state để lưu dữ liệu từ API
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Dùng useEffect để gọi API
  useEffect(() => {
    const fetchAllProperties = async () => {
      try {
        // Dùng axios để gọi API
        const response = await axios.get('http://localhost:8080/api/properties');
        
        // Dữ liệu từ API sẽ nằm trong `response.data`
        // Axios đã tự động parse JSON cho bạn
        setAllProperties(response.data); 
      } catch (err) {
        // Nếu API trả về lỗi (như 404, 500), axios sẽ tự động nhảy vào đây
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProperties();
  }, []); // [] đảm bảo chỉ gọi 1 lần

  // 3. Chuẩn hoá dữ liệu từ state `allProperties` thay vì mock data
  const baseItems = useMemo(
    () =>
      (allProperties || []).map((x) => {
        const images = Array.isArray(x.images) && x.images.length
          ? x.images.slice(0, 4)
          : Array.from(
              { length: Math.max(1, Math.min(4, Number(x.photos) || 1)) },
              () => x.image
            ).filter(Boolean);

        return {
          id: x.id,
          title: x.title,
          address: x.addressFull || x.addressShort,
          area: x.area,
          bed: x.bed,
          bath: x.bath,
          priceLabel: x.price,
          priceTrieu: parsePriceToTrieu(x.price),
          pricePerM2Text: x.pricePerM2,
          postedAt: x.postedAt,
          description: x.description || "",
          agent: x.agent || null,
          image: x.image,
          images,
          photosCount: images.length,
          tags: x.tags || [],
          type: x.type,
          category: x.category,
        };
      }),
    [allProperties] // Phụ thuộc vào `allProperties`
  );

  // ==================== THAY ĐỔI KẾT THÚC TẠI ĐÂY ====================

  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [filters, setFilters] = useState(null);

  const filteredAll = useMemo(() => {
    let arr = baseItems;

    const clean = (s) => {
      if (!s) return "";
      let t = decodeURIComponent(s);
      if (t.startsWith("/")) {
        t = t.slice(1);
      }
      return t;
    };

    if (type) {
      arr = arr.filter((p) => p.type === type);
    }
    if (category) {
      const cat = clean(category);
      arr = arr.filter((p) => {
        const pcat = clean(p.category);
        return pcat === cat;
      });
    }
    if (keyword) {
      arr = arr.filter((it) => matchKeyword(it, keyword));
    }
    if (filters) {
      const minTrieu = vndToTrieu(filters.priceFrom);
      const maxTrieu = vndToTrieu(filters.priceTo);
      if (minTrieu != null) arr = arr.filter((p) => (p.priceTrieu ?? 0) >= minTrieu);
      if (maxTrieu != null) arr = arr.filter((p) => (p.priceTrieu ?? 0) <= maxTrieu);
      if (filters.areaFrom != null)
        arr = arr.filter((p) => (p.area ?? 0) >= filters.areaFrom);
      if (filters.areaTo != null)
        arr = arr.filter((p) => (p.area ?? 0) <= filters.areaTo);
      if (Array.isArray(filters.beds) && filters.beds.length) {
        const maxBeds = Math.max(
          ...filters.beds.map(extractInt).filter((x) => x != null)
        );
        if (Number.isFinite(maxBeds))
          arr = arr.filter((p) => (p.bed ?? 0) >= maxBeds);
      }
      if (Array.isArray(filters.baths) && filters.baths.length) {
        const maxBaths = Math.max(
          ...filters.baths.map(extractInt).filter((x) => x != null)
        );
        if (Number.isFinite(maxBaths))
          arr = arr.filter((p) => (p.bath ?? 0) >= maxBaths);
      }
    }
    return sortItems(arr, sort);
  }, [baseItems, type, category, keyword, sort, filters]);

  useEffect(() => {
    setPage(1);
  }, [keyword, sort, filters, type, category]);

  const total = filteredAll.length;
  const start = (page - 1) * pageSize;
  const pageItems = filteredAll.slice(start, start + pageSize);

  const handleResetAll = () => {
    setKeyword("");
    setSort("relevance");
    setFilters(null);
    setPage(1);
  };

  // 4. Xử lý giao diện cho Loading và Error
  if (loading) {
    return <div className="text-center py-20">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-600">Lỗi: {error.message}. Vui lòng kiểm tra lại kết nối API.</div>;
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
        onApplyFilters={setFilters}
      />

      <div className="mt-3 text-sm text-gray-600">
        {type && (
          <span>
            Loại: <Tag color="blue">{type}</Tag>
          </span>
        )}
        {category && (
          <span>
            {" "}
            / Danh mục: <Tag color="blue">{category}</Tag>
          </span>
        )}
        <> — Tìm thấy <b>{total}</b> kết quả</>
      </div>

      <SearchList items={pageItems} />

      <div className="mt-6 flex justify-center">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={[6, 9, 12, 18, 24, 36]}
          onChange={(pg, ps) => {
            setPage(pg);
            setPageSize(ps);
          }}
        />
      </div>
    </div>
  );
}