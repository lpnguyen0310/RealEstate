// src/api/cloudinary.js
import api from "@/api/axios";

/**
 * Gọi BE xin chữ ký Cloudinary
 * @param {string} folder ví dụ "properties" hoặc `properties/${userId}`
 * @returns {Promise<{timestamp:number, signature:string, apiKey:string, cloudName:string, folder:string}>}
 */
export async function getUploadSignature(folder = "properties") {
    const { data } = await api.post("/cloudinary/sign", { folder });
    // BE của bạn trả JSON payload trực tiếp => data đã là object cần dùng
    return data;
}

/**
 * Upload trực tiếp file lên Cloudinary.
 * Dùng axios riêng biệt (absolute URL) để không dính baseURL /api.
 *
 * @param {File|Blob} file
 * @param {{cloudName:string, apiKey:string, signature:string, timestamp:number, folder:string}} sig
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<object>} kết quả Cloudinary (có secure_url, public_id, ...)
 */
export async function uploadToCloudinary(file, sig, onProgress) {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", sig.timestamp);
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    // Dùng fetch (nhẹ, không dính interceptor). Bạn có thể đổi sang axios nếu thích.
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
    }
    return res.json();
}

/**
 * Upload nhiều file tuần tự (có thể custom song song nếu muốn)
 * @param {File[]} files
 * @param {string} folder
 * @param {(i:number,pct:number)=>void} [onOneProgress]
 * @returns {Promise<{secure_url:string, public_id:string}[]>}
 */
export async function uploadMany(files = [], folder = "properties", onOneProgress) {
    if (!files.length) return [];
    const sig = await getUploadSignature(folder);
    const out = [];
    for (let i = 0; i < files.length; i++) {
        const r = await uploadToCloudinary(files[i], sig, (pct) => onOneProgress?.(i, pct));
        out.push({ secure_url: r.secure_url, public_id: r.public_id });
    }
    return out;
}
