export const nfmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

export const vnd = (n) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

export const initials = (fullName = "") =>
    fullName
        .trim()
        .split(/\s+/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();