import React from "react";

/**
 * AtmBankPicker
 * Props:
 *  - banks: Array<{ id: string; name?: string; logoSrc: string }>
 *  - selectedId?: string
 *  - onChange?: (id: string) => void
 *  - note?: string  // dòng mô tả phía dưới tiêu đề
 */
export default function AtmBankPicker({
  banks = [],
  selectedId,
  onChange = () => {},
  note = "Thẻ ATM nội địa của bạn phải có hỗ trợ Internet Banking",
}) {
  return (
    <div>
      <div className="text-[15px] font-semibold mb-1">Chọn ngân hàng</div>
      <div className="text-[13px] text-gray-600 mb-3">{note}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {banks.map((b) => {
          const active = selectedId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              className={`h-16 rounded-xl border bg-white flex items-center justify-center p-2 transition
                ${active ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"}`}
              aria-label={b.name || b.id}
              title={b.name || b.id}
            >
              {/* chỉ hiển thị ảnh logo; bạn import ảnh thật ở nơi truyền props */}
              <img
                src={b.logoSrc}
                alt={b.name || b.id}
                className="max-h-10 object-contain"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
