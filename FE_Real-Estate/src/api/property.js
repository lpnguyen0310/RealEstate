import api from "@/api/axios";

/**
 * Gọi BE tạo bài đăng
 * @param {object} payload  // gồm mọi field + imageUrls: string[]
 */
export async function createProperty(payload) {
    // Tuỳ response BE (có thể {id, ...} hoặc {data:...})
    const { data } = await api.post("/properties", payload);
    return data;
}