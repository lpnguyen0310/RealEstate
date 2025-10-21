export const money = (n = 0) =>
  Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// src/utils/price.js
export function formatVNDShort(v) {
  if (v == null || v === "") return "Liên hệ";

  // Nếu đã là chuỗi có chữ (triệu, tỷ, đ, Thỏa thuận...) => giữ nguyên
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return "Liên hệ";
    if (/[^\d,.\s]/.test(s)) return s; // có chữ => đã format
    // nếu là chuỗi số -> convert tiếp ở dưới
    v = Number(s.replace(/\./g, "").replace(",", "."));
  }

  const n = Number(v);
  if (!Number.isFinite(n)) return "Liên hệ";

  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    // >= 1 tỷ
    return trimZeros((n / 1_000_000_000).toFixed(2)) + " tỷ";
  }
  if (abs >= 1_000_000) {
    // >= 1 triệu
    return trimZeros((n / 1_000_000).toFixed(0)) + " triệu";
  }
  // < 1 triệu => hiển thị VND đầy đủ
  return n.toLocaleString("vi-VN") + " đ";
}

function trimZeros(s) {
  // "12.00" -> "12", "12.30" -> "12.3"
  return s.replace(/\.?0+$/, "");
}
