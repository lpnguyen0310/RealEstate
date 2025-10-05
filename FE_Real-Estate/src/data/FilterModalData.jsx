// src/data/FilterModalData.js

// Tabs trên thanh chip (nếu bạn cũng muốn cấu hình từ data)
export const FILTER_TABS = [
  { key: "types", label: "Loại BĐS" },
  { key: "price", label: "Khoảng giá" },
  { key: "area", label: "Diện tích" },
  { key: "beds", label: "Số phòng ngủ" },
  { key: "baths", label: "Số phòng tắm" },
  { key: "dir",  label: "Hướng" },
  { key: "pos",  label: "Vị trí" },
];

export const TYPE_OPTIONS_LEFT = [
  "Nhà ngõ, hẻm",
  "Nhà biệt thự",
  "Nhà liền kề",
  "Officetel",
  "Căn hộ duplex",
  "Đất thổ cư",
  "Đất nông nghiệp",
  "Nhà xưởng/Kho bãi",
];

export const TYPE_OPTIONS_RIGHT = [
  "Nhà mặt tiền",
  "Căn hộ chung cư",
  "Căn hộ studio",
  "Căn hộ dịch vụ",
  "Penthouse",
  "Đất nền dự án",
  "Mặt bằng kinh doanh",
  "Biệt thự/Shophouse/Nhà phố thương mại",
];

export const PRICE_RADIOS = [
  { label: "Dưới 500 triệu", value: "0-0.5" },
  { label: "800 triệu - 1 tỷ", value: "0.8-1" },
  { label: "2 - 3 tỷ", value: "2-3" },
  { label: "5 - 7 tỷ", value: "5-7" },
  { label: "10 - 20 tỷ", value: "10-20" },
  { label: "30 - 40 tỷ", value: "30-40" },
  { label: "Trên 60 tỷ", value: "60+" },
  { label: "500 - 800 triệu", value: "0.5-0.8" },
  { label: "1 - 2 tỷ", value: "1-2" },
  { label: "3 - 5 tỷ", value: "3-5" },
  { label: "7 - 10 tỷ", value: "7-10" },
  { label: "20 - 30 tỷ", value: "20-30" },
  { label: "40 - 60 tỷ", value: "40-60" },
  { label: "Giá thoả thuận", value: "thoa-thuan" },
];

export const AREA_RADIOS = [
  "Dưới 30 m²",
  "30 - 50 m²",
  "50 - 80 m²",
  "80 - 100 m²",
  "100 - 150 m²",
  "150 - 200 m²",
  "200 - 250 m²",
  "250 - 300 m²",
  "300 - 500 m²",
  "Trên 500 m²",
];

export const BED_OPTIONS = [
  "1 phòng ngủ",
  "2 phòng ngủ",
  "3 phòng ngủ",
  "4 phòng ngủ",
  "5 phòng ngủ",
  "6+ phòng ngủ",
];

export const BATH_OPTIONS = [
  "1 phòng tắm",
  "2 phòng tắm",
  "3 phòng tắm",
  "4+ phòng tắm",
];

export const DIRECTION_OPTIONS = [
  "Đông",
  "Tây",
  "Nam",
  "Bắc",
  "Đông - Bắc",
  "Tây - Bắc",
  "Tây - Nam",
  "Đông - Nam",
];

export const POSITION_OPTIONS = ["Mặt tiền", "Hẻm ô tô", "Hẻm xe ba gác", "Hẻm xe máy"];
