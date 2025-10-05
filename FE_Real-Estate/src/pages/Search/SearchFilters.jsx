import { useState, useEffect } from "react";
import { Button, Select } from "antd";
import FilterModal from "../../components/filters/FilterModal"; // đường dẫn tới FilterModal của bạn

export default function SearchFilters({
  keyword,
  onKeywordChange,
  sort,
  onSortChange,
  onResetAll,
  initialFilters,
  onApplyFilters,
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState(keyword || "");

  useEffect(() => setKw(keyword || ""), [keyword]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="text-2xl font-bold">Kết quả tìm kiếm</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-9 rounded border border-gray-300 px-3 outline-none focus:border-blue-500"
          placeholder="Nhập từ khoá…"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onKeywordChange(kw)}
        />
        <Button onClick={() => onKeywordChange(kw)}>Tìm</Button>

        <Button onClick={() => setOpen(true)}>Bộ lọc</Button>

        <span className="text-sm text-gray-500">Sắp xếp:</span>
        <Select
          size="middle"
          value={sort}
          onChange={onSortChange}
          options={[
            { label: "Liên quan", value: "relevance" },
            { label: "Giá tăng dần", value: "priceAsc" },
            { label: "Giá giảm dần", value: "priceDesc" },
            { label: "Diện tích tăng dần", value: "areaAsc" },
            { label: "Diện tích giảm dần", value: "areaDesc" },
          ]}
          style={{ minWidth: 180 }}
        />

        <Button onClick={onResetAll}>Xoá bộ lọc</Button>
      </div>

      {/* Modal bộ lọc (có sẵn) */}
      <FilterModal
        open={open}
        onClose={() => setOpen(false)}
        initial={initialFilters || {}}
        onApply={(f) => {
          onApplyFilters(f);
          setOpen(false);
        }}
      />
    </div>
  );
}
