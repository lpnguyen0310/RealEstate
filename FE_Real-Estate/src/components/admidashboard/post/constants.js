// Nền hover cho hàng bảng
export const HOVER_BG = "#dbe7ff";

// Nhãn trạng thái
export const STATUS_LABEL = {
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đang hiển thị",
  EXPIRING_SOON: "Sắp hết hạn",
  EXPIRINGSOON:"Sắp hết hạn",
  EXPIRED: "Hết hạn",
  HIDDEN: "Đã ẩn",
  REJECTED: "Bị từ chối",
  DRAFT: "Nháp",
  ACTIVE: "Đang hiển thị", // nếu BE có ACTIVE
};

// Màu theo palette của MUI (dùng được nếu theme hỗ trợ đầy đủ)
// Chip color nhận: default | primary | secondary | success | error | info | warning
export const STATUS_CHIP_COLOR = {
  PENDING_REVIEW: "warning",
  PUBLISHED: "success",
  EXPIRING_SOON: "warning",
  EXPIRINGSOON: "warning",
  EXPIRED: "default",
  HIDDEN: "default",
  REJECTED: "error",
  DRAFT: "default",
  ACTIVE: "success",
};

// Style hex tuyệt đối (đảm bảo màu đúng kể cả khi palette chưa cấu hình)
export const STATUS_CHIP_STYLE = {
  PENDING_REVIEW: { bg: "#fde68a", text: "#78350f" },  // cam nhạt
  PUBLISHED:      { bg: "#e6edf9", text: "#0f2350" },  // xanh nhạt
  EXPIRING_SOON:  { bg: "#fed7aa", text: "#78350f" },  // cam pastel
  EXPIRED:        { bg: "#cbd5e1", text: "#334155" },  // xám xanh
  HIDDEN:         { bg: "#cbd5e1", text: "#334155" },  // xám xanh
  REJECTED:       { bg: "#fecdd3", text: "#7f1d1d" },  // hồng nhạt
  DRAFT:          { bg: "#e5e7eb", text: "#374151" },  // xám
  ACTIVE:         { bg: "#e6f4ff", text: "#0f2350" },  // xanh nhẹ (nếu dùng)
};

export const CATEGORIES = ["Căn hộ", "Nhà phố", "Đất nền", "Mặt bằng", "Văn phòng"];
export const LISTING_TYPES = ["NORMAL", "PREMIUM", "VIP"];

export const styles = {
  headCell: { fontWeight: 700, fontSize: 14, color: "#1a3b7c" },
  bodyCell: { fontSize: 14, color: "#2b3a55" },
};
