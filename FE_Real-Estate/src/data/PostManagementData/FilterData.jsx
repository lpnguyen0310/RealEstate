// src/data/postFilters.js

// Khu vực
export const AREA_OPTIONS = [
  { label: "TP. HCM", value: "hcm" },
  { label: "Hà Nội", value: "hn" },
  { label: "Đà Nẵng", value: "dn" },
];

// Trạng thái tự động đăng
export const AUTO_POSTING = [
  { label: "Tất cả", value: "all" },
  { label: "Đang bật", value: "on" },
  { label: "Đang tắt", value: "off" },
];

// Preset khoảng giá (VNĐ)
export const PRICE_PRESETS = [
  { key: "lt500",   label: "< 500 triệu",        min: 0,             max: 500_000_000 },
  { key: "500_800", label: "500–800 triệu",      min: 500_000_000,   max: 800_000_000 },
  { key: "800_1t",  label: "800 triệu – 1 tỷ",   min: 800_000_000,   max: 1_000_000_000 },
  { key: "1_2t",    label: "1–2 tỷ",             min: 1_000_000_000, max: 2_000_000_000 },
  { key: "2_3t",    label: "2–3 tỷ",             min: 2_000_000_000, max: 3_000_000_000 },
  { key: "gt3t",    label: "> 3 tỷ",             min: 3_000_000_000, max: null },
];
