import api from "../axios";

export const kpiApi = {
  getNewUsers(range) {
    return api.get("/admin/kpi/new-users", { params: { range } });
  },
};