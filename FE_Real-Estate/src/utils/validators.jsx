import dayjs from "dayjs";
export const isPhone = (v) =>
  /^(0|\+?\d{1,3})?\d{8,12}$/.test((v || "").replace(/\s|-/g, ""));

export const isEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export const validateEmailOrPhone = (_, value) => {
  if (!value) return Promise.reject("Vui lòng nhập email hoặc số điện thoại");
  return isEmail(value) || isPhone(value)
    ? Promise.resolve()
    : Promise.reject("Định dạng không hợp lệ");
};

export const maskPhone = (raw = "") => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6) return raw;
  return `(+84)${digits.slice(-5, -3)}***${digits.slice(-3)}`;
};
export const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const mask = (s) =>
    s.length <= 2 ? s[0] + "*" : s[0] + "*".repeat(s.length - 2) + s.slice(-1);
  const parts = domain.split(".");
  return `${mask(user)}@${[mask(parts[0] || ""), ...parts.slice(1)].join(".")}`;
};


const num = (v) => Number(String(v ?? "").replace(/[^\d.]/g, ""));
const empty = (v) => !String(v ?? "").trim();

export const rules = {
  title: (v) =>
    empty(v) ? "Tiêu đề không được để trống"
      : (v.length < 30 || v.length > 99) ? "Tiêu đề 30–99 ký tự"
        : null,

  description: (v) =>
    empty(v) ? "Mô tả không được để trống"
      : (v.length < 30 || v.length > 5000) ? "Mô tả 30–5000 ký tự"
        : null,

  propertyType: (v) => empty(v) ? "Loại BĐS không được để trống" : null,

  price: (v) => {
    if (empty(v)) return "Giá không được để trống";
    const n = num(v);
    return !Number.isFinite(n) || n <= 0 ? "Giá phải là số > 0" : null;
  },

  position: (v) => empty(v) ? "Vị trí bắt buộc phải chọn" : null,

  // landArea: (v) => {
  //   if (empty(v)) return "Diện tích đất không được để trống";
  //   const n = num(v);
  //   return !Number.isFinite(n) || n <= 0 ? "Diện tích đất phải là số > 0" : null;
  // },

  // provinceId: (v) => empty(v) ? "Tỉnh/Thành phố không được để trống" : null,
  // districtId: (v) => empty(v) ? "Quận/Huyện không được để trống" : null,
  // wardId: (v) => empty(v) ? "Phường/Xã không được để trống" : null,
  // suggestedAddress: (v) => empty(v) ? "Địa chỉ đề xuất không được để trống" : null,

  legalDocument: (v) => empty(v) ? "Giấy tờ pháp lý không được để trống" : null,
};

export const validateField = (name, value) => rules[name]?.(value) ?? null;

export const validateMany = (data, fields) => {
  const errs = {};
  fields.forEach((f) => {
    const msg = validateField(f, data[f]);
    if (msg) errs[f] = msg;
  });
  return errs;
};

export const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
    .format(Number(n || 0)).replace("₫", "đ");

export const priceText = (val) => {
  const n = Number(val || 0);
  if (!n) return "—";
  const b = n / 1e9;
  return b >= 1 ? `${(+b.toFixed(1)).toString().replace(/\.0$/, "")} tỷ` : formatVND(n);
};

export const makeUrl = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item.url) return item.url;
  if (item.previewUrl) return item.previewUrl;
  return ""; // File/Blob -> tạo objectURL ở component
};



export const fmtDate = (v) =>
  v && dayjs(v).isValid() ? dayjs(v).format("HH:mm:ss DD/MM/YYYY") : "-";

export const initials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "NA";
  const f = parts[0][0] || "";
  const l = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (f + l).toUpperCase();
};

export const money = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ" : "-";

/** Chuẩn hoá trạng thái: PUBLISHED -> EXPIRING_SOON / EXPIRED theo expiresAt */
export const normalizeStatuses = (posts) => {
  const now = dayjs();
  return posts.map((p) => {
    if (p.status === "PUBLISHED") {
      if (p.expiresAt && dayjs(p.expiresAt).isBefore(now)) return { ...p, status: "EXPIRED" };
      if (p.expiresAt && dayjs(p.expiresAt).diff(now, "day") <= 7) return { ...p, status: "EXPIRING_SOON" };
    }
    return p;
  });
};

export const countByStatus = (list = []) => {
  const map = {
    PUBLISHED: 0,
    PENDING_REVIEW: 0,
    DRAFT: 0,
    REJECTED: 0,
    EXPIRED: 0,
    EXPIRING_SOON: 0,
    HIDDEN: 0,
  };

  list.forEach((p) => {
    const key = (p.status || "").toUpperCase();
    if (map[key] !== undefined) {
      map[key]++;
    }
  });

  return map;
};