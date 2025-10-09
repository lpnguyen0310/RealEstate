import { useMemo, useState, useEffect } from "react";
import { Tag, Pagination } from "antd";
import { useSearchParams } from "react-router-dom";
import SearchFilters from "../Search/SearchFilters";
import SearchList from "../Search/SearchList";
import { FEATURED_PROPERTIES } from "../../data/properties";

// ===== Helpers =====
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
  const type = searchParams.get("type"); // e.g. "sell", "rent", ...
  const category = searchParams.get("category"); // e.g. "can-ho-chung-cu", etc.

  // Chuẩn hoá dữ liệu
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
          postedAt: x.postedAt,
          description: x.description || "",
          agent: x.agent || null,
          image: x.image,
          images,
          photosCount: images.length,
          tags: x.tags || [],
          // Nếu source dữ liệu của bạn có type & category, trả vào đây
          type: x.type,
          category: x.category,
        };
      }),
    []
  );

  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [filters, setFilters] = useState(null);

  const filteredAll = useMemo(() => {
    let arr = baseItems;

    // Helper clean để chuẩn hóa chuỗi category / p.category
    const clean = (s) => {
      if (!s) return "";
      let t = decodeURIComponent(s);
      if (t.startsWith("/")) {
        t = t.slice(1);
      }
      return t;
    };

    // Lọc theo type nếu có
    if (type) {
      arr = arr.filter((p) => p.type === type);
    }

    // Lọc theo category nếu có
    if (category) {
      const cat = clean(category);
      arr = arr.filter((p) => {
        const pcat = clean(p.category);
        return pcat === cat;
      });
    }

    // Lọc theo từ khóa
    if (keyword) {
      arr = arr.filter((it) => matchKeyword(it, keyword));
    }

    // Lọc theo các filter bổ sung nếu có
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

    // Sort cuối cùng
    return sortItems(arr, sort);
  }, [baseItems, type, category, keyword, sort, filters]);


  // Khi các điều kiện đổi (keyword, sort, filters, type, category) → đưa trang về 1
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
