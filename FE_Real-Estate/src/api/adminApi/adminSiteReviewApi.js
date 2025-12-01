// src/api/adminApi/adminSiteReviewApi.js
import api from "@/api/axios";

const adminSiteReviewApi = {
    getReviews({ page = 1, size = 10, status = "", sentiment = "" }) {
        return api.get("/admin/site-reviews", {
            params: {
                page,
                size,
                status: status || undefined,
                sentiment: sentiment || undefined, // 🔹 mới
            },
        });
    },

    updateStatus(id, action) {
        return api.patch(`/admin/site-reviews/${id}/${action}`);
    },

    getStats() {
        return api.get("/admin/site-reviews/stats");
    },
};

export default adminSiteReviewApi;
