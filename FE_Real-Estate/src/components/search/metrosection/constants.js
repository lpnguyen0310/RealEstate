// src/components/search/metrosection/metro.constants.js
export const HCM_CENTER = { lat: 10.7769, lng: 106.7009 };
export const RADIUS_M = 80000;

export const LINES = [
    {
        id: "M1",
        color: "#E53935",
        title: "Tuyến số 1",
        subtitle: "Bến Thành – Suối Tiên",
        stations: [
            "Ga Bến Thành", "Ga Nhà Hát Thành Phố", "Ga Ba Son", "Ga Công Viên Văn Thánh",
            "Ga Tân Cảng", "Ga Thảo Điền", "Ga An Phú", "Ga Rạch Chiếc", "Ga Phước Long",
            "Ga Bình Thái", "Ga Thủ Đức", "Ga Khu Công Nghệ Cao", "Ga Đại Học Quốc Gia",
            "Ga Suối Tiên", "Ga Bến xe Miền Đông mới",
        ],
    },
    {
        id: "M2",
        color: "#F4B000",
        title: "Tuyến số 2",
        subtitle: "Bến Thành – Tham Lương",
        stations: [
            "Ga Thủ Thiêm", "Ga Bình Khánh", "Ga Bệnh Viện Quốc Tế", "Ga Cung Thiếu Nhi",
            "Ga Đại Lộ Vòng Cung", "Ga Hàm Nghi", "Ga Bến Thành", "Ga Tao Đàn", "Ga Dân Chủ",
            "Ga Hòa Hưng", "Ga Lê Thị Riêng", "Ga Phạm Văn Hai", "Ga Bảy Hiền", "Ga Bàu Cát",
            "Ga Phú Thọ Hòa", "Ga 3 Tháng 2", "Ga Nguyễn Hồng Đào", "Ga Tân Bình",
            "Ga Chợ Bàu Cát", "Ga Cộng Hòa", "Ga Trường Chinh", "Ga Tân Thới Nhất", "Ga Tham Lương",
        ],
    },
];

export const normalize = (s = "") =>
    s.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(nha\s*ga|ga\s*ngam|ga)\b/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

const ALIASES = {
    M1: [
        "Ben Thanh", "Nha Hat Thanh Pho", "Ba Son", "Cong Vien Van Thanh", "Tan Cang",
        "Thao Dien", "An Phu", "Rach Chiec", "Phuoc Long", "Binh Thai", "Thu Duc",
        "Khu Cong Nghe Cao", "Dai Hoc Quoc Gia", "Suoi Tien", "Ben xe Mien Dong moi",
    ].map(normalize),
    M2: [
        "Thu Thiem", "Binh Khanh", "Benh Vien Quoc Te", "Cung Thieu Nhi", "Dai Lo Vong Cung",
        "Ham Nghi", "Ben Thanh", "Tao Dan", "Dan Chu", "Hoa Hung", "Le Thi Rieng", "Pham Van Hai",
        "Bay Hien", "Bau Cat", "Phu Tho Hoa", "3 Thang 2", "Nguyen Hong Dao", "Tan Binh",
        "Cho Bau Cat", "Cong Hoa", "Truong Chinh", "Tan Thoi Nhat", "Tham Luong",
    ].map(normalize),
};

export const guessLineId = (stationName) => {
    const n = normalize(stationName);
    if (ALIASES.M1.some((a) => n.includes(a))) return "M1";
    if (ALIASES.M2.some((a) => n.includes(a))) return "M2";
    return null;
};

export const buildOverpassUrl = (center = HCM_CENTER, radius = RADIUS_M) => {
    const q = `
[out:json][timeout:45];
(
  node["railway"="station"]["station"="subway"](around:${radius},${center.lat},${center.lng});
  node["public_transport"="station"]["subway"="yes"](around:${radius},${center.lat},${center.lng});
  node["railway"="station"]["subway"="yes"](around:${radius},${center.lat},${center.lng});
  node["railway"="halt"]["subway"="yes"](around:${radius},${center.lat},${center.lng});
  node["railway"="station"]["light_rail"="yes"](around:${radius},${center.lat},${center.lng});
  node["railway"="station"]["construction"~".*"](around:${radius},${center.lat},${center.lng});
  node["railway"="station"]["proposed"~".*"](around:${radius},${center.lat},${center.lng});
  node["public_transport"="station"]["construction"~".*"](around:${radius},${center.lat},${center.lng});
  node["public_transport"="station"]["proposed"~".*"](around:${radius},${center.lat},${center.lng});
);
out body;`;
    return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
};
