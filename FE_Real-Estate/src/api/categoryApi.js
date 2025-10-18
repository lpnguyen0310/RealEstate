import api from "@/api/axios";

export const categoryApi = {
  getAll() {
    return api.get("/categories").then(res => res.data);
  },
};
