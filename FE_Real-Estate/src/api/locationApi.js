import api from "@/api/axios";

export const locationApi = {
    async getCities() {
        const res = await api.get(`/locations/cities`);
        return res.data; // [{ id, name }]
    },

    async getDistricts(cityId) {
        const res = await api.get(`/locations/districts`, {
            params: { cityId },
        });
        return res.data; // [{ id, name }]
    },

    async getWards(districtId) {
        const res = await api.get(`/locations/wards`, {
            params: { districtId },
        });
        return res.data; // [{ id, name }]
    },
};
