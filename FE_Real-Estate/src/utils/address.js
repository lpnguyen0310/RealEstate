export const shortUnit = (s = "") =>
    s.replace(/^Thành phố\s+/i, "TP. ")
        .replace(/^Tỉnh\s+/i, "")
        .replace(/^Quận\s+/i, "Q. ")
        .replace(/^Huyện\s+/i, "H. ")
        .replace(/^Thị xã\s+/i, "TX. ")
        .replace(/^Thành phố Thủ Đức$/i, "TP. Thủ Đức")
        .replace(/^Phường\s+/i, "P. ")
        .replace(/^Xã\s+/i, "X. ")
        .replace(/^Thị trấn\s+/i, "TT. ");
