import api from "@/api/axios";

const siteReviewApi = {
    create(payload) {
        return api.post("/site-reviews", payload);
    },

    getSummary(limit = 5) {
        return api.get("/site-reviews/summary", {
            params: { limit },
        });
    },
};

export default siteReviewApi;
