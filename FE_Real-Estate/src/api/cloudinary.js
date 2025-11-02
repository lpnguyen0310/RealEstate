// /src/api/cloudinary.js
import api from "@/api/axios";

/**
 * Xin chữ ký upload Cloudinary từ BE
 * @param {string} folder ví dụ "support/123"
 * @returns {Promise<{timestamp:number, signature:string, apiKey:string, cloudName:string, folder:string}>}
 */
export async function getUploadSignature(folder = "support") {
    const { data } = await api.post("/cloudinary/sign", { folder });
    return data;
}

/**
 * Upload 1 file lên Cloudinary với resource_type=auto (ảnh/pdf/office/zip...)
 * @param {File|Blob} file
 * @param {{cloudName:string, apiKey:string, signature:string, timestamp:number, folder:string}} sig
 * @returns {Promise<object>} { secure_url, public_id, resource_type, bytes, format, width?, height? ... }
 */
export async function uploadToCloudinary(file, sig) {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", sig.timestamp);
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    // quan trọng: auto/upload để Cloudinary nhận diện mọi loại file
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: form }
    );
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
    }
    return res.json();
}

/**
 * Upload nhiều file (tuần tự)
 * @param {File[]} files
 * @param {string} folder
 * @returns {Promise<Array<{secure_url:string, public_id:string, resource_type:string}>>}
 */
export async function uploadMany(files = [], folder = "support") {
    if (!files.length) return [];
    const sig = await getUploadSignature(folder);
    const out = [];
    for (let i = 0; i < files.length; i++) {
        const r = await uploadToCloudinary(files[i], sig);
        out.push({
            secure_url: r.secure_url,
            public_id: r.public_id,
            resource_type: r.resource_type,
        });
    }
    return out;
}
