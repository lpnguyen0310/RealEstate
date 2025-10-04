// Ảnh gallery (swiper + viewerjs)
export const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502005229762-cf1b2da7c8f9?q=80&w=1600&auto=format&fit=crop",
];

// Thông tin breadcrumb, title, địa chỉ, statistics đầu trang
export const POST_INFO = {
  breadcrumb: ["Bán", "Đà Nẵng", "Hòa Vang", "Bán đất tại đường Nguyễn Triệu Luật"],
  title:
    "Chủ Gửi Bán Lô Đất Tái Định Cư Hòa Sơn 6 - Phường Hòa Khánh - TP Đà Nẵng. Giá 2,6 tỷ, gần Đường DT 602..",
  address: "Đường Nguyễn Triệu Luật, Xã Hòa Sơn, Hòa Vang, Đà Nẵng",
  stats: {
    priceText: "2,6 tỷ",
    pricePerM2: "~26 triệu/m²",
    areaText: "100 m²",
    frontageText: "Mặt tiền 5 m",
  },
  growthNotice: {
    text: "+ 66,7% · Giá bán đã tăng trong 1 năm qua",
    cta: "Xem lịch sử giá ›",
  },
};

// Card môi giới
export const AGENT = {
  name: "Huynh Dieu",
  avatar: "https://i.pravatar.cc/100?img=21",
  otherPostsText: "Xem thêm 52 tin khác",
  phoneMasked: "0935 784 ***",
  phoneFull: "0935 784 123",
  tags: ["Đăng ký miễn phí", "Chính chủ", "Đã kiểm định"],
};

// Phần “Thông tin mô tả”
export const DESCRIPTION = {
  headline: "CHÍNH CHỦ GỬI BÁN LÔ ĐẤT TDC HÒA SƠN 6 P. HÒA KHÁNH, TP. ĐÀ NẴNG",
  bullets: [
    "Diện tích: 100m² (5x20 vuông vức)",
    "Hướng: Đông Nam mát mẻ",
    "Đường: 5,5m lộ giới, kết nối lối thoát hiểm, đầu lưng đường DT 602",
    "Pháp lý: Sổ hồng chính chủ, sang tên công chứng ngay",
  ],
  nearbyTitle: "Tiện ích xung quanh:",
  nearby: [
    "Gần trường mầm non, trường tiểu học, THCS Trần Quang Khải, THPT Phạm Phú Thứ",
    "Khu dân cư đồng bộ, văn minh, an ninh tốt",
    "Cạnh Ngân hàng Agribank Hòa Sơn, gần chợ, khu công nghệ cao, giao thông thuận tiện",
  ],
  priceLine: "Giá bán: 2,6 tỷ · Giá rẻ nhất khu vực!",
  suggest: "Thích hợp mua để ở hoặc đầu tư sinh lời lâu dài.",
};

// “Đặc điểm bất động sản” (2 cột)
export const PROPERTY_FEATURES = {
  left: [
    { label: "Khoảng giá", value: "2,6 tỷ", icon: "clock" },
    { label: "Diện tích", value: "100 m²", icon: "area" },
    { label: "Hướng nhà", value: "Đông - Nam", icon: "compass" },
  ],
  right: [
    { label: "Mặt tiền", value: "5 m", icon: "house" },
    { label: "Đường vào", value: "5,5 m", icon: "road" },
    { label: "Pháp lý", value: "Sổ đỏ/ Sổ hồng", icon: "doc" },
  ],
  maxWidth: "50%", // để bạn điều chỉnh 50% section như yêu cầu
};

// Bản đồ & meta dưới bản đồ
export const MAP = {
  lat: 16.047,
  lng: 108.206,
  zoom: 16,
};

export const MAP_META = [
  { label: "Ngày đăng", value: "04/10/2025" },
  { label: "Ngày hết hạn", value: "14/10/2025" },
  { label: "Loại tin", value: "Tin thường" },
  { label: "Mã tin", value: "44187492" },
];
