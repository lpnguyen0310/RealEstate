// src/data/properties.js
// ==== LIST NGẮN GỌN DÙNG CHO CARD ====
export const FEATURED_PROPERTIES = [
  {
    id: 1,
    image: "/src/assets/section3-image1.jpg",
    title: "bán nhà cạnh sân bay 5x15 (75m2) 3 tầng 6,999 tỷ hẻm oto",
    price: "6.9 tỷ",
    pricePerM2: "~92 triệu/m²",
    postedAt: "1 ngày trước",
    photos: 4,
    addressShort: "Phường Tân Sơn, Thành phố Hồ Chí Minh",
    addressFull: "Phường 15, Quận Tân Bình, Thành phố Hồ Chí Minh",
    area: 75, bed: 2, bath: 2,
  },
  // ... các item 2..10 (y như bạn đã đưa)
];

// ==== CHI TIẾT THEO ID (tuỳ từng bài có thể khác nhau) ====
// Bạn chỉ cần khai 1 số trường đổi theo từng bài; phần còn thiếu sẽ fallback.
// ==== CHI TIẾT THEO ID (tuỳ từng bài có thể khác nhau) ====
// Bạn chỉ cần khai 1 số trường đổi theo từng bài; phần còn thiếu sẽ fallback.
export const PROPERTY_DETAILS = {
  1: {
    gallery: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop",
    ],
    postInfo: {
      breadcrumb: ["Bán", "TP.HCM", "Tân Bình", "Nhà gần sân bay, hẻm ô tô"],
      title: "Nhà 3 tầng 5x15 gần sân bay - hẻm ô tô - giá tốt",
      address: "Phường 15, Quận Tân Bình, Thành phố Hồ Chí Minh",
      stats: {
        priceText: "6,9 tỷ",
        pricePerM2: "~92 triệu/m²",
        areaText: "75 m²",
        frontageText: "Mặt tiền 5 m",
      },
      growthNotice: {
        text: "+ 12% · Giá tăng so với năm trước",
        cta: "Xem lịch sử giá ›",
      },
    },
    description: {
      headline: "CHÍNH CHỦ BÁN NHÀ 3 TẦNG GẦN SÂN BAY TÂN SƠN NHẤT",
      bullets: [
        "DT: 5x15 (75m²). Kết cấu 1 trệt 2 lầu",
        "Hẻm ô tô tránh, khu dân trí cao",
        "Pháp lý chuẩn, công chứng ngay",
      ],
      nearbyTitle: "Tiện ích xung quanh:",
      nearby: [
        "5 phút ra sân bay Tân Sơn Nhất",
        "Gần chợ, trường học, bệnh viện",
        "Khu an ninh, yên tĩnh",
      ],
      priceLine: "Giá chốt: 6,9 tỷ (thương lượng)",
      suggest: "Phù hợp để ở hoặc khai thác cho thuê.",
    },
    features: {
      left: [
        { label: "Khoảng giá", value: "6,9 tỷ" },
        { label: "Diện tích", value: "75 m²" },
        { label: "Hướng nhà", value: "Đông Nam" },
      ],
      right: [
        { label: "Mặt tiền", value: "5 m" },
        { label: "Đường vào", value: "Ô tô tránh" },
        { label: "Pháp lý", value: "Sổ hồng" },
      ],
      maxWidth: "50%",
    },
    map: { lat: 10.813, lng: 106.662, zoom: 16 },
    mapMeta: [
      { label: "Ngày đăng", value: "04/10/2025" },
      { label: "Ngày hết hạn", value: "14/10/2025" },
      { label: "Loại tin", value: "Tin thường" },
      { label: "Mã tin", value: "44187492" },
    ],
    agent: {
      name: "Nguyễn A",
      avatar: "https://i.pravatar.cc/100?img=11",
      otherPostsText: "Xem thêm 12 tin khác",
      phoneMasked: "0909 123 ***",
      phoneFull: "0909 123 456",
      tags: ["Chính chủ", "Đã kiểm định"],
    },
  },

  // ====== ID = 2: Căn hộ Quận 7 (khác hẳn ID=1) ======
  2: {
    gallery: [
      "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d95?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
    ],
    postInfo: {
      breadcrumb: ["Bán", "TP.HCM", "Quận 7", "Căn hộ ven sông"],
      title: "Căn hộ 2PN 68m² view sông, nội thất đẹp - Quận 7",
      address: "Đường Nguyễn Lương Bằng, P. Tân Phú, Quận 7, TP.HCM",
      stats: {
        priceText: "3,2 tỷ",
        pricePerM2: "~47 triệu/m²",
        areaText: "68 m²",
        frontageText: "Ban công Đông Bắc",
      },
      growthNotice: {
        text: "+ 7,5% · Giá ổn định 12 tháng",
        cta: "Xem lịch sử giá ›",
      },
    },
    description: {
      headline: "BÁN NHANH CĂN 2PN FULL NỘI THẤT - VIEW SÔNG CỰC ĐẸP",
      bullets: [
        "Diện tích tim tường: 68m², 2PN - 2WC",
        "Ban công đón gió sông, thoáng mát quanh năm",
        "Tặng toàn bộ nội thất cao cấp còn mới",
      ],
      nearbyTitle: "Tiện ích nội khu & xung quanh:",
      nearby: [
        "Hồ bơi, gym, khu BBQ, công viên ven sông",
        "Gần Crescent Mall, SC VivoCity",
        "5 phút tới Phú Mỹ Hưng",
      ],
      priceLine: "Giá bán: 3,2 tỷ (bao thuế phí)",
      suggest: "Dọn vào ở ngay, pháp lý minh bạch.",
    },
    features: {
      left: [
        { label: "Khoảng giá", value: "3,2 tỷ" },
        { label: "Diện tích", value: "68 m²" },
        { label: "Hướng nhà", value: "Đông Bắc" },
      ],
      right: [
        { label: "Tầng", value: "Tầng trung" },
        { label: "Phí quản lý", value: "15k/m²" },
        { label: "Pháp lý", value: "Sổ hồng lâu dài" },
      ],
      maxWidth: "50%",
    },
    map: { lat: 10.735, lng: 106.721, zoom: 16 },
    mapMeta: [
      { label: "Ngày đăng", value: "05/10/2025" },
      { label: "Ngày hết hạn", value: "20/10/2025" },
      { label: "Loại tin", value: "Tin VIP" },
      { label: "Mã tin", value: "55881234" },
    ],
    agent: {
      name: "Trần B",
      avatar: "https://i.pravatar.cc/100?img=25",
      otherPostsText: "Xem thêm 8 tin khác",
      phoneMasked: "0912 88* ***",
      phoneFull: "0912 889 668",
      tags: ["Uy tín", "Tư vấn tận tâm"],
    },
  },

  // ====== ID = 3: Nhà vườn Thủ Đức (khác hẳn ID=1 & 2) ======
  3: {
    gallery: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop",
    ],
    postInfo: {
      breadcrumb: ["Bán", "TP.HCM", "TP. Thủ Đức", "Nhà vườn trong khu an ninh"],
      title: "Nhà vườn 1 trệt 1 lầu, sân rộng 120m² - TP. Thủ Đức",
      address: "Đường 11, P. Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM",
      stats: {
        priceText: "7,8 tỷ",
        pricePerM2: "~65 triệu/m²",
        areaText: "120 m²",
        frontageText: "Mặt tiền 6 m",
      },
      growthNotice: {
        text: "+ 3,1% · Giá nhích nhẹ quý gần đây",
        cta: "Xem lịch sử giá ›",
      },
    },
    description: {
      headline: "NHÀ VƯỜN SÂN RỘNG, NHIỀU CÂY XANH - THIẾT KẾ ẤM CÚNG",
      bullets: [
        "DT: 6x20 (120m²) sân trước rộng, đậu được 2 xe",
        "1 trệt 1 lầu, 3PN - 3WC, giếng trời thông thoáng",
        "Khu dân cư an ninh, yên tĩnh, hàng xóm thân thiện",
      ],
      nearbyTitle: "Tiện ích xung quanh:",
      nearby: [
        "5 phút tới Vincom Lê Văn Việt",
        "Gần Khu Công Nghệ Cao, Đại học Quốc gia",
        "Kết nối Xa lộ Hà Nội, Vành đai 3",
      ],
      priceLine: "Giá chào: 7,8 tỷ (TL nhẹ)",
      suggest: "Phù hợp gia đình trẻ/đa thế hệ, không gian xanh.",
    },
    features: {
      left: [
        { label: "Khoảng giá", value: "7,8 tỷ" },
        { label: "Diện tích", value: "120 m²" },
        { label: "Hướng nhà", value: "Tây Bắc" },
      ],
      right: [
        { label: "Mặt tiền", value: "6 m" },
        { label: "Đường vào", value: "6 m - ô tô vào nhà" },
        { label: "Pháp lý", value: "Hoàn công đầy đủ" },
      ],
      maxWidth: "50%",
    },
    map: { lat: 10.841, lng: 106.817, zoom: 16 },
    mapMeta: [
      { label: "Ngày đăng", value: "06/10/2025" },
      { label: "Ngày hết hạn", value: "21/10/2025" },
      { label: "Loại tin", value: "Tin thường" },
      { label: "Mã tin", value: "66330119" },
    ],
    agent: {
      name: "Lê C",
      avatar: "https://i.pravatar.cc/100?img=47",
      otherPostsText: "Xem thêm 20 tin khác",
      phoneMasked: "0981 77* ***",
      phoneFull: "0981 779 779",
      tags: ["Rõ ràng", "Hỗ trợ vay"],
    },
  },
};


// ==== MOCK MẶC ĐỊNH (FALLBACK) ====
// dùng khi bài chưa có detail riêng
export const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502005229762-cf1b2da7c8f9?q=80&w=1600&auto=format&fit=crop",
];

export const DEFAULT_POST_INFO = {
  breadcrumb: ["Bán", "Đà Nẵng", "Hòa Vang", "Bán đất tại đường Nguyễn Triệu Luật"],
  title: "Chủ Gửi Bán Lô Đất Tái Định Cư Hòa Sơn 6 - Phường Hòa Khánh - TP Đà Nẵng. Giá 2,6 tỷ...",
  address: "Đường Nguyễn Triệu Luật, Xã Hòa Sơn, Hòa Vang, Đà Nẵng",
  stats: {
    priceText: "2,6 tỷ",
    pricePerM2: "~26 triệu/m²",
    areaText: "100 m²",
    frontageText: "Mặt tiền 5 m",
  },
  growthNotice: { text: "+ 66,7% · Giá bán đã tăng trong 1 năm qua", cta: "Xem lịch sử giá ›" },
};

export const DEFAULT_DESCRIPTION = {
  headline: "CHÍNH CHỦ GỬI BÁN LÔ ĐẤT TDC HÒA SƠN 6 P. HÒA KHÁNH, TP. ĐÀ NẴNG",
  bullets: [
    "Diện tích: 100m² (5x20 vuông vức)",
    "Hướng: Đông Nam mát mẻ",
    "Đường: 5,5m lộ giới",
    "Pháp lý: Sổ hồng chính chủ",
  ],
  nearbyTitle: "Tiện ích xung quanh:",
  nearby: ["Gần trường học", "Khu dân cư đồng bộ", "Giao thông thuận tiện"],
  priceLine: "Giá bán: 2,6 tỷ · Giá rẻ nhất khu vực!",
  suggest: "Thích hợp mua để ở hoặc đầu tư.",
};

export const DEFAULT_FEATURES = {
  left: [
    { label: "Khoảng giá", value: "2,6 tỷ" },
    { label: "Diện tích", value: "100 m²" },
    { label: "Hướng nhà", value: "Đông - Nam" },
  ],
  right: [
    { label: "Mặt tiền", value: "5 m" },
    { label: "Đường vào", value: "5,5 m" },
    { label: "Pháp lý", value: "Sổ đỏ/ Sổ hồng" },
  ],
  maxWidth: "50%",
};

export const DEFAULT_MAP = { lat: 16.047, lng: 108.206, zoom: 16 };
export const DEFAULT_MAP_META = [
  { label: "Ngày đăng", value: "04/10/2025" },
  { label: "Ngày hết hạn", value: "14/10/2025" },
  { label: "Loại tin", value: "Tin thường" },
  { label: "Mã tin", value: "44187492" },
];

export const DEFAULT_AGENT = {
  name: "Huynh Dieu",
  avatar: "https://i.pravatar.cc/100?img=21",
  otherPostsText: "Xem thêm 52 tin khác",
  phoneMasked: "0935 784 ***",
  phoneFull: "0935 784 123",
  tags: ["Đăng ký miễn phí", "Chính chủ", "Đã kiểm định"],
};

// ==== ADAPTER: hợp nhất dữ liệu theo id ====
export function getPropertyDetailById(id) {
  const base = FEATURED_PROPERTIES.find((p) => String(p.id) === String(id));
  const extra = PROPERTY_DETAILS[id] || {};

  const gallery =
    (extra.gallery && extra.gallery.length ? extra.gallery : null) ||
    (base?.image ? [base.image] : null) ||
    DEFAULT_GALLERY_IMAGES;

  const postInfo = {
    breadcrumb: extra.postInfo?.breadcrumb || DEFAULT_POST_INFO.breadcrumb,
    title: extra.postInfo?.title || base?.title || DEFAULT_POST_INFO.title,
    address: extra.postInfo?.address || base?.addressFull || DEFAULT_POST_INFO.address,
    stats: {
      priceText: extra.postInfo?.stats?.priceText || base?.price || DEFAULT_POST_INFO.stats.priceText,
      pricePerM2: extra.postInfo?.stats?.pricePerM2 || base?.pricePerM2 || DEFAULT_POST_INFO.stats.pricePerM2,
      areaText: extra.postInfo?.stats?.areaText || (base?.area ? `${base.area} m²` : DEFAULT_POST_INFO.stats.areaText),
      frontageText: extra.postInfo?.stats?.frontageText || DEFAULT_POST_INFO.stats.frontageText,
    },
    growthNotice: extra.postInfo?.growthNotice || DEFAULT_POST_INFO.growthNotice,
  };

  const description = extra.description || DEFAULT_DESCRIPTION;
  const features = extra.features || DEFAULT_FEATURES;
  const map = extra.map || DEFAULT_MAP;
  const mapMeta = extra.mapMeta || DEFAULT_MAP_META;
  const agent = extra.agent || DEFAULT_AGENT;

  return { base, gallery, postInfo, description, features, map, mapMeta, agent };
}
