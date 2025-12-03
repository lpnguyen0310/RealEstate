// /src/components/supportchat/supportChatUtils.js
export const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

export const uid = () => Math.random().toString(36).slice(2, 10);

export const formatBytes = (b = 0) => {
    if (!b) return "0 B";
    const k = 1024;
    const u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${u[i]}`;
};

// Cloudinary helpers
export function clThumbFromUrl(secureUrl, { w = 360, h = 360, fit = "c_fill" } = {}) {
    if (!secureUrl) return secureUrl;
    return secureUrl.replace(
        "/upload/",
        `/upload/${fit},w_${w},h_${h},q_auto,f_auto/`
    );
}

// chỉ dùng cho NÚT "Tải xuống" (ép attachment)
export function clDownloadUrl(secureUrl, filename) {
    if (!secureUrl) return secureUrl;
    const flag = filename
        ? `fl_attachment:${encodeURIComponent(filename)}`
        : "fl_attachment";
    return secureUrl.replace("/upload/", `/upload/${flag}/`);
}

// Detect loại tệp
export function isImage(att) {
    const mime = (att?.mimeType || "").toLowerCase();
    const name = (att?.name || "").toLowerCase();
    return (
        mime.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
    );
}
