import { useMemo, useState, useEffect } from "react";
import { Tag, Pagination } from "antd";
import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import { FEATURED_PROPERTIES } from "../../data/properties";

/* ===== Helpers ===== */
// parse "6.9 tỷ" -> 6900 (triệu); "950 triệu" -> 950
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
const within = (n, min, max) => {
  if (min != null && n < min) return false;
  if (max != null && n > max) return false;
  return true;
};

export default function SearchResultsPage() {
  // Chuẩn hoá từ FEATURED_PROPERTIES
  const baseItems = useMemo(
    () =>
        (FEATURED_PROPERTIES || []).map((x) => {
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

            postedAt: x.postedAt,               // NEW
            description: x.description || "",   // NEW
            agent: x.agent || null,             // NEW

            image: x.image,
            images,
            photosCount: images.length,         // NEW
            tags: [],
        };
        }),
    []
    );


  // --- State trong trang (không dùng URL) ---
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("relevance"); // relevance | priceAsc | priceDesc | areaAsc | areaDesc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [filters, setFilters] = useState(null); // dữ liệu trả về từ FilterModal

  // --- Pipeline lọc + sort ---
  const filteredAll = useMemo(() => {
    let arr = baseItems.filter((it) => matchKeyword(it, keyword));

    if (filters) {
      // giá từ FilterModal là VND -> đổi sang TRIỆU để so sánh
      const minTrieu = vndToTrieu(filters.priceFrom);
      const maxTrieu = vndToTrieu(filters.priceTo);
      if (minTrieu != null) arr = arr.filter((p) => (p.priceTrieu ?? 0) >= minTrieu);
      if (maxTrieu != null) arr = arr.filter((p) => (p.priceTrieu ?? 0) <= maxTrieu);

      if (filters.areaFrom != null) arr = arr.filter((p) => (p.area ?? 0) >= filters.areaFrom);
      if (filters.areaTo != null) arr = arr.filter((p) => (p.area ?? 0) <= filters.areaTo);

      if (Array.isArray(filters.beds) && filters.beds.length) {
        const maxBeds = Math.max(...filters.beds.map(extractInt).filter((x) => x != null));
        if (Number.isFinite(maxBeds)) arr = arr.filter((p) => (p.bed ?? 0) >= maxBeds);
      }
      if (Array.isArray(filters.baths) && filters.baths.length) {
        const maxBaths = Math.max(...filters.baths.map(extractInt).filter((x) => x != null));
        if (Number.isFinite(maxBaths)) arr = arr.filter((p) => (p.bath ?? 0) >= maxBaths);
      }
      // types/directions/positions: mock chưa có -> bỏ qua
    }

    return sortItems(arr, sort);
  }, [baseItems, keyword, sort, filters]);

  // reset về trang 1 khi filter/sort/keyword đổi
  useEffect(() => { setPage(1); }, [keyword, sort, filters]);

  // paginate
  const total = filteredAll.length;
  const start = (page - 1) * pageSize;
  const pageItems = filteredAll.slice(start, start + pageSize);

  const handleResetAll = () => {
    setKeyword("");
    setSort("relevance");
    setFilters(null);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      {/* FILTERS (đã tách riêng) */}
      <SearchFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        sort={sort}
        onSortChange={setSort}
        onResetAll={handleResetAll}
        initialFilters={filters}
        onApplyFilters={setFilters}
      />

      {/* Tổng quan */}
      <div className="mt-3 text-sm text-gray-600">
        {keyword ? (
          <>Từ khóa: <Tag color="blue">{keyword}</Tag> — Tìm thấy <b>{total}</b> kết quả</>
        ) : (
          <>Tìm thấy <b>{total}</b> kết quả</>
        )}
      </div>

      {/* BODY (đã tách riêng) */}
      <SearchList items={pageItems} />

      {/* Phân trang */}
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
