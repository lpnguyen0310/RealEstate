// src/data/PurchageData.js
export const SINGLE = [
    { id: "basic", title: "Tin Thường", price: 0, desc: "Đăng tin cơ bản", note: "Miễn phí" },
    { id: "vip", title: "Tin VIP", price: 25000, desc: "Trên tin thường, x10 lượt xem", note: "Đầy đủ thông tin", tag: "Hiệu suất" },
    { id: "prem", title: "Tin Premium", price: 100000, desc: "Trên tin VIP, x50 lượt xem", note: "Hiển thị ấn tượng", tag: "Bao phủ" },
];

export const COMBOS = [
    { id: "c1", title: "Combo Trải nghiệm", sub: "5 tin VIP", price: 99000, old: 125000, save: 21, chip: "Phù hợp dùng thử" },
    { id: "c2", title: "Combo Tăng tốc", sub: "3 tin Premium, 10 tin VIP", price: 399000, old: 550000, save: 28, chip: "Lựa chọn nhiều nhất" },
    { id: "c3", title: "Combo Dẫn đầu", sub: "10 tin Premium, 20 tin VIP", price: 999000, old: 1500000, save: 34, chip: "Giá hời nhất" },
];

// tiện dùng ở trang
export const ALL_ITEMS = [...SINGLE, ...COMBOS];

// helpers tuỳ chọn
