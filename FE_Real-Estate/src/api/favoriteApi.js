import api from "@/api/axios"; 

export const favoriteApi = {
    async toggle(propertyId) {
        const res = await api.post(`/favorites/${propertyId}/toggle`);
        return res.data; // { saved: true/false }
    },
    async getIds() {
        const res = await api.get(`/favorites/ids`);
        return res.data; // [1, 2, 3]
    },
    async check(propertyId) {
        const res = await api.get(`/favorites/check/${propertyId}`);
        return res.data; // { saved: true/false }
    },
};
