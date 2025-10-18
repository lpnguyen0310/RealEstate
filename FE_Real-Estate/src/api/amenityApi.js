import api from "@/api/axios";

export const amenityApi = {
  getAll() {
    return api.get("/amenities").then(res => res.data);
  },
};