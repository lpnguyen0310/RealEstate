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


export async function getRecommendations({ userId, limit = 8 }) {
    // BE: GET /api/properties/recommendations?userId=&limit=
    const { data } = await api.get("/properties/recommendations", {
        params: { userId, limit },
    });
    return data; // List<PropertyCardDTO>
}