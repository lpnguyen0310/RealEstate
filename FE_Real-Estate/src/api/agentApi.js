// src/api/agentApi.js
import api from "./axios";

const agentApi = {
  getProfile(agentId) {
    return api.get(`/user/${agentId}`);
  },

  getListings(agentId, { type, page = 0, size = 12 } = {}) {
    return api.get(`/user/${agentId}/properties`, {
      params: {
        type: type || undefined, // "sell" | "rent" | undefined
        page,
        size,
      },
    });
  },
};

export default agentApi;
